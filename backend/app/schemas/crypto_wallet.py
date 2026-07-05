from pydantic import BaseModel


class CryptoWalletCreate(BaseModel):
    coin: str
    network: str
    wallet_address: str
    label: str | None = None


class CryptoWalletUpdate(BaseModel):
    coin: str | None = None
    network: str | None = None
    wallet_address: str | None = None
    label: str | None = None
    is_active: bool | None = None


class CryptoWalletOut(BaseModel):
    id: str
    store_id: str
    coin: str
    network: str
    wallet_address: str
    label: str | None
    is_active: bool

    model_config = {"from_attributes": True}
