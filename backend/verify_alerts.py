import sys
import os

# Add the current directory (backend) to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from app.workers.alerts import check_competitor_alerts
from app.db.session import SessionLocal
from app import models
import logging

# Configure logging to see output
logging.basicConfig(level=logging.INFO)

def verify_alerts():
    print("Starting Alert System Verification...")
    
    # Ensure we have at least one business
    db = SessionLocal()
    try:
        business = db.query(models.Business).first()
        if not business:
            print("No business found. Cannot test alerts.")
            return

        print(f"Checking alerts for business: {business.name}")
        
        # Run the alert check synchronously
        check_competitor_alerts()
        print("Alert check completed successfully.")
    except Exception as e:
        print(f"Alert check failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verify_alerts()
