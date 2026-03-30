"""
/api/repo-intel  — Repository Intelligence endpoint.

Fetches from GitHub API:
  - Commit history + timeline
  - Contributors + ownership
  - PRs, Issues
  - Code churn (most changed files)
  - Bus factor, momentum, health score
"""
from __future__ import annotations

import math
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["repo-intel"])

GITHUB_API = "https://api.github.com"

import os
def _gh_headers() -> dict[str, str]:
    h = {"Accept": "application/vnd.github+json", "User-Agent": "OpenPulse/1.0"}
    token = os.getenv("GITHUB_TOKEN", "").strip()
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


# ------------------------------------------------------------------ #
#  Models                                                              #
# ------------------------------------------------------------------ #

class RepoIntelRequest(BaseModel):
    owner: str
    repo:  str


class ContributorStat(BaseModel):
    login:      str
    commits:    int
    additions:  int
    deletions:  int
    pct:        float          # % of total commits


class CommitPoint(BaseModel):
    date:   str                # YYYY-MM-DD
    count:  int


class ChurnFile(BaseModel):
    path:     str
    changes:  int              # additions + deletions across all commits
    commits:  int


class ModuleOwnership(BaseModel):
    module:      str           # top-level folder or "root"
    owner:       str           # contributor with most commits touching it
    ownerPct:    float         # their % of commits in this module
    contributors: int


class RepoIntelResponse(BaseModel):
    # Health
    healthScore:      float
    healthLabel:      str      # Healthy / Fair / At Risk
    busFactor:        int
    # Counts
    totalCommits:     int
    activeDays:       int
    totalPRs:         int
    totalIssues:      int
    openIssues:       int
    # Momentum
    momentumPct:      float    # commits last 7d vs prev 7d
    activityDaysAgo:  int      # days since last commit
    issueHandlingPct: float    # closed / total issues %
    contributorRiskPct: float  # top contributor % of commits
    # Lists
    contributors:     list[ContributorStat]
    timeline:         list[CommitPoint]
    churnFiles:       list[ChurnFile]
    moduleOwnership:  list[ModuleOwnership]


# ------------------------------------------------------------------ #
#  Endpoint                                                            #
# ------------------------------------------------------------------ #

@router.post("/repo-intel", response_model=RepoIntelResponse)
async def repo_intel(req: RepoIntelRequest) -> RepoIntelResponse:
    owner, repo = req.owner, req.repo

    async with httpx.AsyncClient(
        timeout=30.0,
        headers=_gh_headers(),
        follow_redirects=True,
    ) as client:
        # Run independent fetches
        commits_raw, prs_raw, issues_raw, stats_raw = await _fetch_all(
            client, owner, repo
        )

    # ── process ────────────────────────────────────────────────── #
    timeline      = _build_timeline(commits_raw)
    contributors  = _build_contributors(stats_raw, commits_raw)
    churn_files   = _build_churn(commits_raw)
    module_own    = _build_module_ownership(commits_raw, contributors)

    total_commits = sum(c.commits for c in contributors) or len(commits_raw)
    active_days   = len({p.date for p in timeline})
    total_prs     = len(prs_raw)
    total_issues  = len(issues_raw)
    open_issues   = sum(1 for i in issues_raw if i.get("state") == "open")
    closed_issues = total_issues - open_issues

    # momentum: commits last 7 days vs previous 7 days
    now = datetime.now(timezone.utc)
    def _days_ago(iso: str) -> float:
        try:
            dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
            return (now - dt).total_seconds() / 86400
        except Exception:
            return 999

    recent7  = sum(1 for c in commits_raw if _days_ago(c.get("commit", {}).get("author", {}).get("date", "")) <= 7)
    prev7    = sum(1 for c in commits_raw if 7 < _days_ago(c.get("commit", {}).get("author", {}).get("date", "")) <= 14)
    momentum = round(((recent7 - prev7) / max(prev7, 1)) * 100, 1)

    # days since last commit
    last_dates = [c.get("commit", {}).get("author", {}).get("date", "") for c in commits_raw]
    last_dates = [d for d in last_dates if d]
    activity_days_ago = int(min(_days_ago(d) for d in last_dates)) if last_dates else 999

    # bus factor = how many contributors make up >= 50% of commits
    bus_factor = _calc_bus_factor(contributors, total_commits)

    # contributor risk = top contributor %
    contributor_risk = contributors[0].pct if contributors else 0.0

    # issue handling %
    issue_handling = round((closed_issues / total_issues) * 100, 1) if total_issues else 100.0

    # health score (0-100, shown as %)
    health = _calc_health(
        bus_factor, contributor_risk, activity_days_ago,
        momentum, total_prs, open_issues, total_commits,
    )
    health_label = "Healthy" if health >= 70 else "Fair" if health >= 40 else "At Risk"

    return RepoIntelResponse(
        healthScore=health,
        healthLabel=health_label,
        busFactor=bus_factor,
        totalCommits=total_commits,
        activeDays=active_days,
        totalPRs=total_prs,
        totalIssues=total_issues,
        openIssues=open_issues,
        momentumPct=momentum,
        activityDaysAgo=activity_days_ago,
        issueHandlingPct=issue_handling,
        contributorRiskPct=round(contributor_risk, 1),
        contributors=contributors[:10],
        timeline=timeline,
        churnFiles=churn_files[:15],
        moduleOwnership=module_own[:10],
    )


# ------------------------------------------------------------------ #
#  GitHub fetchers                                                     #
# ------------------------------------------------------------------ #

async def _fetch_all(
    client: httpx.AsyncClient, owner: str, repo: str
) -> tuple[list, list, list, list]:
    """Fetch commits, PRs, issues, contributor stats in parallel."""
    import asyncio

    async def _get(url: str, params: dict | None = None) -> list:
        results = []
        page = 1
        while True:
            p = {"per_page": 100, "page": page, **(params or {})}
            try:
                r = await client.get(url, params=p)
                if r.status_code == 403:
                    raise HTTPException(429, "GitHub rate limit exceeded — add GITHUB_TOKEN")
                if r.status_code == 404:
                    raise HTTPException(404, f"Repository not found: {owner}/{repo}")
                if r.status_code != 200:
                    break
                batch = r.json()
                if not batch:
                    break
                results.extend(batch)
                if len(batch) < 100:
                    break
                page += 1
                if page > 5:      # cap at 500 items per resource
                    break
            except HTTPException:
                raise
            except Exception:
                break
        return results

    base = f"{GITHUB_API}/repos/{owner}/{repo}"

    commits_task = asyncio.create_task(_get(f"{base}/commits"))
    prs_task     = asyncio.create_task(_get(f"{base}/pulls", {"state": "all"}))
    issues_task  = asyncio.create_task(_get(f"{base}/issues", {"state": "all"}))
    stats_task   = asyncio.create_task(_get(f"{base}/stats/contributors"))

    commits = await commits_task
    prs     = await prs_task
    # issues API returns PRs too — filter them out
    issues_raw = await issues_task
    issues  = [i for i in issues_raw if "pull_request" not in i]
    stats   = await stats_task

    return commits, prs, issues, stats


# ------------------------------------------------------------------ #
#  Processing helpers                                                  #
# ------------------------------------------------------------------ #

def _build_timeline(commits: list) -> list[CommitPoint]:
    counts: dict[str, int] = defaultdict(int)
    for c in commits:
        date_str = c.get("commit", {}).get("author", {}).get("date", "")
        if date_str:
            day = date_str[:10]
            counts[day] += 1
    return [CommitPoint(date=d, count=n) for d, n in sorted(counts.items())]


def _build_contributors(stats: list, commits: list) -> list[ContributorStat]:
    """Use /stats/contributors if available, else fall back to commit list."""
    if stats and isinstance(stats, list) and isinstance(stats[0], dict) and "author" in stats[0]:
        total = sum(s.get("total", 0) for s in stats) or 1
        result = []
        for s in sorted(stats, key=lambda x: x.get("total", 0), reverse=True):
            login = (s.get("author") or {}).get("login", "unknown")
            n     = s.get("total", 0)
            adds  = sum(w.get("a", 0) for w in s.get("weeks", []))
            dels  = sum(w.get("d", 0) for w in s.get("weeks", []))
            result.append(ContributorStat(
                login=login, commits=n, additions=adds, deletions=dels,
                pct=round((n / total) * 100, 1),
            ))
        return result

    # Fallback: count from commit list
    counts: dict[str, int] = defaultdict(int)
    for c in commits:
        author = (c.get("author") or {}).get("login") or \
                 c.get("commit", {}).get("author", {}).get("name", "unknown")
        counts[author] += 1
    total = sum(counts.values()) or 1
    return [
        ContributorStat(login=k, commits=v, additions=0, deletions=0,
                        pct=round((v / total) * 100, 1))
        for k, v in sorted(counts.items(), key=lambda x: -x[1])
    ]


def _build_churn(commits: list) -> list[ChurnFile]:
    """
    Build file churn from commits.
    GitHub's commit list doesn't include file stats by default — we use
    the files list from each commit if present, or skip.
    For speed we only look at the first 50 commits (most recent).
    """
    file_changes: dict[str, dict] = defaultdict(lambda: {"changes": 0, "commits": 0})
    for c in commits[:50]:
        files = c.get("files", [])
        for f in files:
            path = f.get("filename", "")
            chg  = f.get("additions", 0) + f.get("deletions", 0)
            file_changes[path]["changes"] += chg
            file_changes[path]["commits"] += 1

    return [
        ChurnFile(path=p, changes=d["changes"], commits=d["commits"])
        for p, d in sorted(file_changes.items(), key=lambda x: -x[1]["changes"])
    ]


def _build_module_ownership(
    commits: list, contributors: list[ContributorStat]
) -> list[ModuleOwnership]:
    """Map top-level folder → contributor with most commits touching it."""
    # module → { contributor → commit_count }
    module_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for c in commits:
        author = (c.get("author") or {}).get("login") or \
                 c.get("commit", {}).get("author", {}).get("name", "unknown")
        for f in c.get("files", []):
            path = f.get("filename", "")
            parts = path.split("/")
            module = parts[0] if len(parts) > 1 else "root"
            module_counts[module][author] += 1

    result = []
    for module, author_map in module_counts.items():
        total = sum(author_map.values()) or 1
        top_author = max(author_map, key=author_map.__getitem__)
        result.append(ModuleOwnership(
            module=module,
            owner=top_author,
            ownerPct=round((author_map[top_author] / total) * 100, 1),
            contributors=len(author_map),
        ))

    return sorted(result, key=lambda x: -x.ownerPct)


def _calc_bus_factor(contributors: list[ContributorStat], total: int) -> int:
    cumulative = 0.0
    for i, c in enumerate(contributors):
        cumulative += c.pct
        if cumulative >= 50.0:
            return i + 1
    return len(contributors)


def _calc_health(
    bus_factor: int,
    contributor_risk: float,
    activity_days_ago: int,
    momentum: float,
    total_prs: int,
    open_issues: int,
    total_commits: int,
) -> float:
    score = 100.0

    # Bus factor penalty
    if bus_factor == 1:   score -= 25
    elif bus_factor == 2: score -= 10

    # Contributor concentration penalty
    if contributor_risk > 80:   score -= 20
    elif contributor_risk > 60: score -= 10

    # Activity penalty
    if activity_days_ago > 30:   score -= 20
    elif activity_days_ago > 14: score -= 10

    # Negative momentum penalty
    if momentum < -50:   score -= 15
    elif momentum < -20: score -= 7

    # Bonus for PRs (collaborative workflow)
    if total_prs > 20:  score += 10
    elif total_prs > 5: score += 5

    # Open issues penalty (if many unresolved)
    if open_issues > 50:  score -= 10
    elif open_issues > 20: score -= 5

    # Commit count bonus
    if total_commits > 200: score += 10
    elif total_commits > 50: score += 5

    return round(max(0.0, min(100.0, score)), 1)