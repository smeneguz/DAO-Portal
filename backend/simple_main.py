from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI(
    title="DAO Portal API",
    description="API for DAO metrics and analytics", 
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load mock DAO data
def load_dao_data():
    dao_data_path = os.path.join(os.path.dirname(__file__), "..", "..", "dao_data.json")
    try:
        with open(dao_data_path, 'r') as f:
            data = json.load(f)
            return data.get('daos', []) if isinstance(data, dict) else data
    except FileNotFoundError:
        # Return mock data if file not found
        return [
            {
                "id": "uniswap",
                "name": "Uniswap",
                "description": "Decentralized exchange protocol",
                "tvl": 5000000000,
                "market_cap": 8000000000,
                "governance_token": "UNI",
                "active_proposals": 15,
                "total_members": 250000,
                "treasury_value": 2500000000
            },
            {
                "id": "compound",
                "name": "Compound",
                "description": "Decentralized lending protocol",
                "tvl": 3000000000,
                "market_cap": 5000000000,
                "governance_token": "COMP",
                "active_proposals": 8,
                "total_members": 120000,
                "treasury_value": 1200000000
            },
            {
                "id": "aave",
                "name": "Aave",
                "description": "Decentralized lending and borrowing protocol",
                "tvl": 6000000000,
                "market_cap": 7500000000,
                "governance_token": "AAVE",
                "active_proposals": 12,
                "total_members": 180000,
                "treasury_value": 1800000000
            }
        ]

# Load data on startup
dao_data = load_dao_data()

@app.get("/")
async def root():
    return {"message": "DAO Portal API", "status": "running"}

@app.get("/api/v1/dao")
async def get_daos():
    return {"daos": dao_data}

@app.get("/api/v1/dao/{dao_id}")
async def get_dao(dao_id: str):
    dao = next((d for d in dao_data if d["id"] == dao_id), None)
    if not dao:
        return {"error": "DAO not found"}, 404
    return dao

@app.get("/api/v1/dao/{dao_id}/metrics")
async def get_dao_metrics(dao_id: str):
    dao = next((d for d in dao_data if d["id"] == dao_id), None)
    if not dao:
        return {"error": "DAO not found"}, 404
    
    # Return mock metrics
    return {
        "participation_rate": 0.65,
        "decentralization_score": 0.78,
        "treasury_growth": 0.12,
        "voting_power_distribution": {
            "top_10_percent": 0.45,
            "next_40_percent": 0.35,
            "bottom_50_percent": 0.20
        },
        "proposal_success_rate": 0.72,
        "average_voting_time": 5.2
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
