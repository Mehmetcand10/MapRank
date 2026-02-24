from typing import List, Dict, Any
from app import models
import json

class AIGrowthEngine:
    """
    Analyzes Grid Ranking data to provide actionable growth suggestions.
    """
    
    def generate_suggestions(self, snapshot: models.GridRankSnapshot) -> List[Dict[str, Any]]:
        """
        Analyzes the snapshot points and identifies patterns of low visibility.
        """
        points = snapshot.points
        low_perf_points = [p for p in points if p.rank is None or p.rank > 5]
        
        if not low_perf_points:
            return [{
                "category": "Maintenance",
                "title": "Excellent Visibility",
                "suggestion": "You have top-tier visibility in this grid. Focus on maintaining response rates and fresh photo updates to stay ahead.",
                "impact": "High"
            }]

        # Analyze winners in low-perf areas
        competitors = {}
        for p in low_perf_points:
            winner = p.is_competitor_winner
            if winner:
                competitors[winner] = competitors.get(winner, 0) + 1
        
        top_competitor = max(competitors, key=competitors.get) if competitors else "Local competitors"
        
        suggestions = []
        
        # Pattern 1: Core visibility
        if snapshot.visibility_score < 40:
            suggestions.append({
                "category": "SEO",
                "title": "Core Visibility Gap",
                "suggestion": f"Your business is losing to '{top_competitor}' in {len(low_perf_points)} out of {len(points)} grid points. Consider updating your GMB categories and adding the keyword '{snapshot.keyword}' to your business description.",
                "impact": "Critical"
            })
            
        # Pattern 2: Geographic pockets
        # (Simplified logic for now: if more than 50% points are bad)
        if len(low_perf_points) > (len(points) / 2):
            suggestions.append({
                "category": "Content",
                "title": "Local Authority Boost",
                "suggestion": "Visibility drops significantly outside your immediate center. Ask for reviews from customers located in the outer grid zones to boost geographic authority.",
                "impact": "Medium"
            })

        # Pattern 3: Competitor specific
        if competitors:
            suggestions.append({
                "category": "Comparison",
                "title": f"Competitor Analysis: {top_competitor}",
                "suggestion": f"'{top_competitor}' is dominating the outer circles. Analyze their photo count and posting frequency; they likely have more recent 'Update' posts on their profile.",
                "impact": "High"
            })
            
        return suggestions

ai_growth_engine = AIGrowthEngine()
