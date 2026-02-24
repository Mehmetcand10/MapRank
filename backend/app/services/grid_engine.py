import math
from typing import List, Tuple

class GridEngine:
    """
    Service for calculating geographic grid points around a center location.
    """
    
    def generate_grid(self, center_lat: float, center_lng: float, radius_km: float, grid_size: int = 5) -> List[Tuple[float, float]]:
        """
        Generates a grid of (lat, lng) points around a center.
        grid_size: e.g. 5 means a 5x5 grid (25 points).
        """
        # Earth's radius in km
        EARTH_RADIUS = 6371.0
        
        points = []
        
        # Calculate the distance between grid points
        # Grid size 1 means just the center. 
        # For grid_size > 1, we cover the full radius span.
        if grid_size <= 1:
            return [(center_lat, center_lng)]
            
        # The step distance in km
        step_km = (2 * radius_km) / (grid_size - 1)
        
        # Latitude: 1 degree approx 111 km
        lat_step = (step_km / EARTH_RADIUS) * (180 / math.pi)
        
        # Start from top-left (North-West)
        start_lat = center_lat + (radius_km / EARTH_RADIUS) * (180 / math.pi)
        
        for i in range(grid_size):
            current_lat = start_lat - (i * lat_step)
            
            # Longitude: step varies with latitude
            # 1 degree approx 111 * cos(lat) km
            lng_span_km = 2 * radius_km
            lng_step_deg = (step_km / (EARTH_RADIUS * math.cos(math.radians(current_lat)))) * (180 / math.pi)
            
            start_lng = center_lng - (radius_km / (EARTH_RADIUS * math.cos(math.radians(current_lat)))) * (180 / math.pi)
            
            for j in range(grid_size):
                current_lng = start_lng + (j * lng_step_deg)
                points.append((current_lat, current_lng))
                
        return points

    def calculate_visibility_score(self, ranks: List[int]) -> float:
        """
        Calculates a visibility percentage (0-100) based on ranking positions.
        Formula: (Sum of (Weight / Rank)) / MaxPossibleWeight
        Simplified: Average position weight.
        """
        if not ranks:
            return 0.0
            
        total_points = 0.0
        for rank in ranks:
            if rank is None or rank <= 0 or rank > 20:
                continue
            
            # Weight: 1st place = 100, 20th place = 5
            weight = max(0, 105 - (rank * 5))
            total_points += weight
            
        # Max score is 100 per grid point
        max_points = len(ranks) * 100
        return round((total_points / max_points) * 100, 1)

grid_engine = GridEngine()
