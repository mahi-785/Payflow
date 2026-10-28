from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://payflow:payflow@localhost:5432/payflow"
    cors_origins: list[str] = ["http://localhost:5173"]
    # Payment rules (all amounts in integer cents)
    max_amount_cents: int = 500_000          # hard decline above $5,000
    # Risk rules
    large_amount_cents: int = 100_000        # flag at/above $1,000
    velocity_window_seconds: int = 60
    velocity_max_prior: int = 3              # flag when >= 3 earlier txns with same token in window


settings = Settings()
