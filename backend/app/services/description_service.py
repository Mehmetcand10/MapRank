import logging
import random
from typing import List, Optional

logger = logging.getLogger(__name__)

class AIDescriptionService:
    def generate_description(self, 
        business_name: str, 
        category: str, 
        location: str, 
        keywords: List[str], 
        tone: str = "professional"
    ) -> str:
        """
        AI Simulation for GMB Description Generation.
        In production, this would call GPT-4.
        """
        
        templates = {
            "professional": [
                "{location} bölgesinde lider {category} olarak, {keywords} alanındaki uzmanlığımızla hizmetinizdeyiz. {business_name} olarak kalite ve güveni temsil ediyoruz.",
                "Profesyonel {category} çözümlerimizle {location}'da fark yaratıyoruz. {keywords} konusundaki tecrübemizle {business_name} her zaman yanınızda."
            ],
            "friendly": [
                "Merhaba! {location}'daki sıcak yuvamızda {category} hizmetleri sunuyoruz. {business_name} ailesi olarak {keywords} konusunda size yardımcı olmaktan mutluluk duyarız.",
                "{location} sakinlerine özel {category} deneyimi! {business_name}'de {keywords} beklediğinizden daha fazlasını bulacaksınız."
            ],
            "sales": [
                "{location}'nın en çok tercih edilen {category} merkezi! {business_name} ile {keywords} avantajlarından hemen yararlanın. En iyi fiyat ve kalite garantisi!",
                "Fırsatları kaçırmayın! {location} {category} pazarında {business_name} ile {keywords} performansınızı zirveye taşıyın."
            ]
        }
        
        template = random.choice(templates.get(tone, templates["professional"]))
        
        # Clean keywords for display
        kw_str = ", ".join(keywords[:3])
        
        description = template.format(
            business_name=business_name,
            category=category,
            location=location,
            keywords=kw_str
        )
        
        return description

ai_description_service = AIDescriptionService()
