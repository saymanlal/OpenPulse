from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from typing import List, Dict, Any
from datetime import datetime, timedelta
import random

router = APIRouter()

class RepoIntelRequest(BaseModel):
    owner: str
    repo: str

class RepoIntelResponse(BaseModel):
    commitTimeline: List[Dict[str, Any]]
    topContributors: List[Dict[str, Any]]
    commitsByBranch: List[Dict[str, Any]]
    prStats: Dict[str, Any]
    issueStats: Dict[str, Any]
    healthMetrics: Dict[str, Any]
    codeChurn: List[Dict[str, Any]]
    activityHeatmap: List[Dict[str, Any]]

# ---------------- FIXED CONTRIBUTORS ---------------- #

def process_contributors(commits: List[Dict]) -> List[Dict]:
    contributors = {}

    for commit in commits:
        try:
            github_author = commit.get("author") or {}
            login = (github_author.get("login") or "").lower().strip()

            if not login:
                continue

            avatar = github_author.get("avatar_url", "")

            if login not in contributors:
                contributors[login] = {
                    "author": login,   # ALWAYS use login
                    "commits": 0,
                    "avatar": avatar
                }

            contributors[login]["commits"] += 1

        except:
            continue

    return sorted(contributors.values(), key=lambda x: x["commits"], reverse=True)[:10]

# ---------------------------------------------------- #

async def fetch_github_data(owner: str, repo: str):
    base_url = f"https://api.github.com/repos/{owner}/{repo}"

    try:
        async with httpx.AsyncClient() as client:
            commits = (await client.get(f"{base_url}/commits", params={"per_page": 100})).json()
            prs = (await client.get(f"{base_url}/pulls", params={"state": "all", "per_page": 100})).json()
            issues = (await client.get(f"{base_url}/issues", params={"state": "all", "per_page": 100})).json()
            branches = (await client.get(f"{base_url}/branches")).json()

            return {
                "commits": commits if isinstance(commits, list) else [],
                "prs": prs if isinstance(prs, list) else [],
                "issues": issues if isinstance(issues, list) else [],
                "branches": branches if isinstance(branches, list) else []
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------- REST SAME (UNCHANGED) ---------- #

def process_commit_timeline(commits: List[Dict]) -> List[Dict]:
    timeline = {}
    for c in commits:
        try:
            d = c["commit"]["author"]["date"]
            date = datetime.fromisoformat(d.replace("Z", "+00:00")).date().isoformat()
            timeline[date] = timeline.get(date, 0) + 1
        except:
            pass

    result = []
    for i in range(30):
        date = (datetime.now().date() - timedelta(days=i)).isoformat()
        result.insert(0, {"date": date, "count": timeline.get(date, 0)})
    return result

def process_branches(branches, commits):
    return [{"branch": b.get("name", "unknown"), "commits": random.randint(5, 50)} for b in branches[:5]]

def process_prs(prs):
    merged = sum(1 for p in prs if p.get("merged_at"))
    closed = sum(1 for p in prs if p.get("state") == "closed" and not p.get("merged_at"))
    open_count = sum(1 for p in prs if p.get("state") == "open")
    total = merged + closed
    return {
        "merged": merged,
        "closed": closed,
        "open": open_count,
        "successRate": (merged / total * 100) if total else 0
    }

def process_issues(issues):
    issues = [i for i in issues if not i.get("pull_request")]
    return {
        "open": sum(1 for i in issues if i.get("state") == "open"),
        "closed": sum(1 for i in issues if i.get("state") == "closed"),
        "avgResponseTime": 48
    }

def calculate_health_metrics(data):
    commits = data["commits"]

    contributors = {c.get("author", {}).get("login") for c in commits if c.get("author")}
    total = len(contributors)

    bus = min(max(total // 3, 1), 5)

    return {
        "healthScore": min(total * 10, 100),
        "busFactor": bus,
        "contributorRisk": 20,
        "momentum": 10,
        "activeDays": 10,
        "avgPrMergeTime": 72
    }

def generate_code_churn(commits):
    files = ["index.ts", "Header.tsx", "utils.ts"]
    return [{"file": f, "changes": random.randint(5, 150)} for f in files]

def generate_activity_heatmap():
    return [{"week": w, "day": d, "commits": random.randint(0, 10)} for w in range(12) for d in range(7)]

# ---------------- MAIN ---------------- #

@router.post("/repo-intel", response_model=RepoIntelResponse)
async def get_repo_intel(request: RepoIntelRequest):
    data = await fetch_github_data(request.owner, request.repo)

    return {
        "commitTimeline": process_commit_timeline(data["commits"]),
        "topContributors": process_contributors(data["commits"]),
        "commitsByBranch": process_branches(data["branches"], data["commits"]),
        "prStats": process_prs(data["prs"]),
        "issueStats": process_issues(data["issues"]),
        "healthMetrics": calculate_health_metrics(data),
        "codeChurn": generate_code_churn(data["commits"]),
        "activityHeatmap": generate_activity_heatmap()
    }