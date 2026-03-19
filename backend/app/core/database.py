from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite+aiosqlite:///./openpulse.db')
DATABASE_ECHO = os.getenv('DATABASE_ECHO', 'false').lower() == 'true'

engine = create_async_engine(
    DATABASE_URL,
    echo=DATABASE_ECHO,
    future=True,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
