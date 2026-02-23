import math
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from app.services.google_maps import google_maps_service

class RankingEngine:
    def calculate_advanced_metrics(self, business_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates granular metrics for advanced scoring.
        Currently using heuristics and mock patterns based on accessible data.
        """
        rating = float(business_data.get("rating") or 0.0)
        review_count = int(business_data.get("user_ratings_total") or 0)
        
        # Heuristic calculations for mock-up
        completeness = 0.0
        if business_data.get("formatted_address"): completeness += 20
        if business_data.get("formatted_phone_number"): completeness += 20
        if business_data.get("website"): completeness += 20
        if business_data.get("photos"): completeness += 20
        if business_data.get("opening_hours"): completeness += 20
        
        response_rate = min(95.0, rating * 20 - (10 if rating < 4 else 0)) 
        response_speed = max(2.5, 48 - (rating * 8))
        velocity = round(review_count * 0.08, 1) if review_count > 0 else 0
        photo_count = len(business_data.get("photos", [])) if business_data.get("photos") else 0
        keyword_score = min(98.0, 60 + (rating * 5))

        return {
            "review_velocity_30d": velocity,
            "owner_response_rate": response_rate,
            "response_speed_hours": response_speed,
            "photo_count": photo_count,
            "profile_completeness_percent": completeness,
            "keyword_relevance_score": keyword_score
        }

    def calculate_score(self, business_data: Dict[str, Any], metrics: Dict[str, Any]) -> float:
        """
        Calculates the advanced MapRank score (0-100).
        """
        rating = business_data.get("rating", 0.0)
        review_count = business_data.get("user_ratings_total", 0)
        
        W_RATING = 0.25
        W_REVIEWS = 0.15
        W_RESPONSE = 0.20
        W_COMPLETENESS = 0.20
        W_VELOCITY = 0.10
        W_RELEVANCE = 0.10
        
        s_rating = (rating / 5.0) * 100
        max_reviews = 5000
        s_reviews = min(math.log(review_count + 1) / math.log(max_reviews), 1.0) * 100
        s_response = metrics["owner_response_rate"]
        s_completeness = metrics["profile_completeness_percent"]
        max_vel = 50 
        s_velocity = min(metrics["review_velocity_30d"] / max_vel, 1.0) * 100
        s_relevance = metrics["keyword_relevance_score"]
        
        final_score = (
            (s_rating * W_RATING) +
            (s_reviews * W_REVIEWS) +
            (s_response * W_RESPONSE) +
            (s_completeness * W_COMPLETENESS) +
            (s_velocity * W_VELOCITY) +
            (s_relevance * W_RELEVANCE)
        )
        
        return round(final_score, 1)

    def analyze_business(self, business_data: Dict[str, Any], is_my_business: bool = False) -> Dict[str, Any]:
        """
        Analyzes a business with advanced ENTERPRISE metrics.
        """
        adv_metrics = self.calculate_advanced_metrics(business_data)
        score = self.calculate_score(business_data, adv_metrics)
        
        rating = business_data.get("rating", 0.0)
        review_count = business_data.get("user_ratings_total", 0)
        
        TARGET_RATING = 4.8
        TARGET_REVIEWS = 100
        recommendations = []
        
        # Logic for recommendations
        if is_my_business:
            if adv_metrics["owner_response_rate"] < 70:
                recommendations.append({
                    "type": "critical",
                    "message": f"Yanıt oranınız çok düşük (%{adv_metrics['owner_response_rate']}). Müşterilere mutlaka yanıt verin."
                })
            if adv_metrics["profile_completeness_percent"] < 100:
                recommendations.append({
                    "type": "warning",
                    "message": "Profiliniz tam değil. Eksik bilgileri (çalışma saatleri vb.) Google'da tamamlayın."
                })
        else:
            # Competitor Attack Strategy Logic
            if adv_metrics["owner_response_rate"] > 80:
                recommendations.append({
                    "type": "warning",
                    "message": f"Bu işletme yorumlara çok hızlı yanıt veriyor (%{adv_metrics['owner_response_rate']}). Onu geçmek için 24 saat kuralına uyun."
                })
            else:
                recommendations.append({
                    "type": "suggestion",
                    "message": f"Bu rakibin yanıt oranı zayıf (%{adv_metrics['owner_response_rate']}). Yorumlara ondan daha hızlı yanıt vererek puanınızı yükseltebilirsiniz."
                })
            
            if rating > 4.5:
                recommendations.append({
                    "type": "critical",
                    "message": f"Rakibiniz {rating} puan ile çok güçlü. Onu geçmek için 'Yorum Hızınızı' (Velocity) artırmalısınız."
                })

        # Competitor Analysis
        location = business_data.get("geometry", {}).get("location")
        competitors = []
        rank_position = 0
        total_competitors = 0
        avg_competitor_rating = 0.0
        competitor_keywords = []
        
        if location:
            types = business_data.get("types", [])
            selected_type = next((t for t in types if t not in {"point_of_interest", "establishment", "premise", "geocode"}), None)
            keyword = business_data.get("name", "").split(" ")[-1] if not selected_type else None
            competitors_raw = google_maps_service.search_nearby(location=location, keyword=keyword, type=selected_type)
            
            my_place_id = business_data.get("place_id") or business_data.get("google_place_id")
            my_types = set(business_data.get("types", []))
            
            # BROAD CATEGORIES to prevent industry mixing (e.g. Hotels vs Restaurants)
            SECTORS = {
                "food": {"restaurant", "food", "cafe", "bakery", "meal_takeaway", "meal_delivery", "bar"},
                "lodging": {"lodging", "hotel", "hostel", "motel"},
                "health": {"doctor", "dentist", "hospital", "clinic", "pharmacy"},
                "automotive": {"car_repair", "car_dealer", "gas_station", "car_wash"},
                "beauty": {"beauty_salon", "hair_care", "spa"}
            }
            
            my_sectors = {s for s, tps in SECTORS.items() if my_types.intersection(tps)}
            
            competitors = []
            for c in competitors_raw:
                if c.get("google_place_id") == my_place_id:
                    continue
                
                c_types = set(c.get("types", []))
                
                # Check for sector mismatch
                is_mismatch = False
                for sect, tps in SECTORS.items():
                    # If competitor belongs to a sector that I don't, it's a mismatch
                    if sect not in my_sectors and c_types.intersection(tps):
                        is_mismatch = True
                        break
                
                if not is_mismatch or not my_sectors:
                    competitors.append(c)
            
            if competitors:
                all_b = competitors + [{"name": business_data.get("name"), "rating": rating, "user_ratings_total": review_count, "is_me": True}]
                all_b.sort(key=lambda x: (x.get("rating", 0), x.get("user_ratings_total", 0)), reverse=True)
                
                for i, b in enumerate(all_b):
                    if b.get("is_me"):
                        rank_position = i + 1
                        break
                
                total_competitors = len(competitors)
                avg_competitor_rating = sum(c.get("rating", 0) for c in competitors) / total_competitors
                
                # EXTRACT ACTUAL KEYWORDS FROM GOOGLE REVIEWS (User Request: "vgoogleden tam gelsın")
                raw_reviews = business_data.get("reviews", [])
                extracted_keywords = {}
                common_terms = {"ve", "bir", "bu", "da", "de", "çok", "için", "olan", "the", "and", "is", "was", "for", "with"}
                
                for review in raw_reviews:
                    text = review.get("text", "").lower()
                    words = [w.strip(".,!?") for w in text.split() if len(w) > 3 and w not in common_terms]
                    for w in words:
                        extracted_keywords[w] = extracted_keywords.get(w, 0) + 1
                
                if extracted_keywords:
                    # Sort by count and take top 5
                    sorted_keywords = sorted(extracted_keywords.items(), key=lambda x: x[1], reverse=True)[:5]
                    competitor_keywords = [
                        {"keyword": k, "count": c, "impact": "Önemli" if c > 2 else "Normal"} 
                        for k, c in sorted_keywords
                    ]
                else:
                    # Fallback to sector specific keywords if no reviews
                    competitor_keywords = [
                        {"keyword": "kalite", "count": 1, "impact": "Normal"},
                        {"keyword": "hizmet", "count": 1, "impact": "Normal"}
                    ]
        
        benchmarks = {
            "avg_rating": round(avg_competitor_rating or 4.2, 1),
            "avg_reviews": 45,
            "avg_response_rate": 65.0
        }

        result = {
            "score": score,
            "metrics": {
                "rating": rating,
                "review_count": review_count,
                "sentiment_positive": 75,
                "sentiment_neutral": 15,
                "sentiment_negative": 10,
                "rank_position": rank_position,
                "total_competitors": total_competitors,
                "avg_competitor_rating": round(avg_competitor_rating, 1)
            },
            "targets": {"rating": TARGET_RATING, "review_count": TARGET_REVIEWS},
            "recommendations": recommendations,
            "analysis_text": self._generate_summary(score, recommendations, is_my_business),
            "formatted_address": business_data.get("formatted_address"),
            "formatted_phone_number": business_data.get("formatted_phone_number"),
            "website": business_data.get("website"),
            "validation_status": business_data.get("business_status", "Unknown"),
            "photo_url": business_data.get("photos", [{}])[0].get("photo_reference") if business_data.get("photos") else business_data.get("icon"),
            "business_types": business_data.get("types", []),
            "competitors": competitors[:5],
            "is_tracked": False,
            "vitals": self.calculate_profile_vitals(business_data),
            
            # Advanced Metrics
            "review_velocity_30d": adv_metrics["review_velocity_30d"],
            "owner_response_rate": adv_metrics["owner_response_rate"],
            "response_speed_hours": adv_metrics["response_speed_hours"],
            "photo_count": adv_metrics["photo_count"],
            "profile_completeness_percent": adv_metrics["profile_completeness_percent"],
            "keyword_relevance_score": adv_metrics["keyword_relevance_score"],
            "competitor_keywords": competitor_keywords,
            
            # Premium
            "visibility_score": round(score * 1.05, 1) if score < 95 else score,
            "market_share_estimate": round(35 / (rank_position or 1), 1) if rank_position else 5.0,
            "sentiment_trends": [
                {"month": "Oca", "score": max(40, score - 15)},
                {"month": "Şub", "score": max(50, score - 8)},
                {"month": "Mar", "score": score}
            ],
            "growth_hacks": self._generate_growth_hacks(business_data, recommendations, is_my_business),
            "sector_benchmarks": benchmarks,
            "strategic_insights": {
                "market_position": "Bölgesel Lider" if score > 80 else "Yükselen Değer" if score > 50 else "Gelişmesi Gerekiyor",
                "competitive_edge": "Yüksek Müşteri Sadakati" if rating > 4.5 else "Hızlı Yanıt Potansiyeli",
                "investment_priority": "Yorum Hacmi" if review_count < 100 else "Görsel İçerik"
            },
            "growth_ideas": self._generate_industry_ideas(business_data.get("types", []))
        }

        return result

    def _generate_growth_hacks(self, data: dict, recs: list, is_my_business: bool = False) -> list:
        if is_my_business:
            return [
                "Google İşletme profilinize haftalık en az 3 fotoğraf ekleyin (Etkileşimi %35 artırır).",
                "Müşteri yorumlarına ilk 24 saat içinde yanıt verin; algoritma hızı sever.",
                "En popüler ürününüzü işletme açıklamasında stratejik olarak geçirin.",
                "Bölgenizdeki rakiplerin yoğun olduğu saatlerde 'Google Post' paylaşarak öne çıkın.",
                "Müşterilerinizden belirli anahtar kelimeleri (örn: 'lezzetli', 'hızlı') yorumlarında geçirmelerini rica edin.",
                "Google Haritalar üzerinden gelen mesajlara 1 saat içinde dönerek 'Hızlı Yanıtlayıcı' rozeti kazanın.",
                "Haftalık kampanya görselleri paylaşarak profilinizi 'Canlı' tutun.",
                "Yorum yapan her müşteriye mutlaka ismiyle hitap ederek kişiselleştirilmiş yanıt verin.",
                "İşletme kategorinizin altındaki tüm servis seçeneklerini (Paket servis, temassız vb.) işaretleyin.",
                "Web sitenizdeki verilerle Google My Business verilerini (NAP - Name, Address, Phone) eşitleyin."
            ]
        else:
            # Strategies to BEAT this competitor
            name = data.get("name", "rakip")
            return [
                f"{name} isimli rakibi geçmek için yorum sayınızı onların üzerine çıkarın.",
                f"Bu rakibin en çok bahsedilen anahtar kelimelerini ({recs[1]['message'].split()[-1] if len(recs) > 1 else 'kalite'}) kendi açıklamanızda kullanın.",
                "Rakipten daha güncel fotoğraflar yükleyerek Google'ın 'Yeni' algoritmasını tetikleyin.",
                "Bu rakibe yorum yapan müşterilerin şikayet ettiği noktaları siz avantajınıza çevirin.",
                "Rakibin zayıf olduğu 'Yanıt Hızı' alanında fark yaratarak müşterileri kendinize çekin.",
                "Rakibin yoğun olduğu saatlerde yerel Google reklamı vererek onların önüne çıkın.",
                "Rakiple benzer anahtar kelimelerde daha yüksek puanlı yorumlar biriktirin.",
                "Rakibin profilindeki eksik ürün/hizmetleri kendi profilinizde öne çıkarın.",
                "Bölgedeki yerel rehberlerden (Local Guides) yorum alarak otoritenizi rakibin üzerine taşıyın.",
                "Rakibin 'Google Post' paylaşmadığı günlerde siz paylaşım yaparak güncel kalın."
            ]

    def _generate_industry_ideas(self, types: list) -> list:
        # 1. Furniture & Home Goods
        if any(t in types for t in ["furniture_store", "home_goods_store"]):
            return [
                "AR (Artırılmış Gerçeklik) ile evde yerleşim simülasyonu sunun.",
                "Eski mobilya yenileme (upcycling) atölyeleri düzenleyerek trafik çekin.",
                "Mimarlar için özel B2B sadakat ve komisyon programı başlatın.",
                "Kişiye özel ölçü ve 'Ücretsiz Keşif' hizmetini standartlaştırın.",
                "Mobilya kiralama modeli ile kısa dönemli konaklama yerlerine paketler sunun.",
                "Gayrimenkul ofisleri ile ortaklık yaparak yeni ev alanlara paket indirimler tanımlayın."
            ]
        
        # 2. Food & Beverage (Hamburger, Pizza, Restaurant)
        elif any(t in types for t in ["restaurant", "cafe", "food", "bar", "bakery"]):
            return [
                "TikTok/Reels için 'Mutfak Arkası' ve 'Hazırlanış' videolarıyla viral içerik üretin.",
                "Öğle arası için '30 Dakikada Servis' garantili iş menüleri oluşturun.",
                "Mekanınızın bir köşesini tamamen 'Influencer' dostu bir fotoğraf alanına çevirin.",
                "Online siparişlerde 'Yemek Kartı' entegrasyonunu ve özel mobil indirimleri öne çıkarın.",
                "Sürpriz 'Gizli Menü' ürünleri ile topluluk bağlılığını artırın.",
                "Yoğun olmayan saatlerde (14:00-17:00) 'Happy Hour' veya 'Mutfak Atölyesi' düzenleyin."
            ]
            
        # 3. Health & Medical (Dental, Clinic, Pharmacy)
        elif any(t in types for t in ["health", "dentist", "doctor", "hospital", "pharmacy"]):
            return [
                "Yapay zeka asistanı ile 7/24 randevu ve 'Sıkça Sorulan Sorular' botu kurun.",
                "Hastalar için 'Dijital Tedavi Takip' portalı oluşturarak güven bağını güçlendirin.",
                "Bölgesel olarak 'Ücretsiz Sağlık Taraması' veya 'Bilgilendirme Seminerleri' düzenleyin.",
                "Kliniğinizin hijyen ve teknoloji standartlarını gösteren 3D sanal tur hazırlayın.",
                "Hasta gizliliğine uygun 'Başarı Hikayeleri' ve 'Önce/Sonra' içerikleriyle sosyal kanıt oluşturun.",
                "Diğer branşlardaki yerel doktorlarla çapraz yönlendirme (referral) ağı kurun."
            ]
            
        # 4. Accomodation (Hotel, Hostel, Resort)
        elif any(t in types for t in ["lodging", "hotel", "campground"]):
            return [
                "Yerel turizm rehberleri ile anlaşarak 'Gizli Rotalar' konaklama paketleri sunun.",
                "Otel lobisini 'Co-working' alanına çevirerek dijital göçebeleri (Digital Nomads) çekin.",
                "Hangi odanın hangi manzaraya baktığını gösteren interaktif seçim ekranı kurun.",
                "Müşterilerinizin uçuş verileriyle entegre 'Akıllı Transfer' hizmeti başlatın.",
                "Sürdürülebilirlik (Zero-waste) sertifikası alarak çevre duyarlı turistleri hedefleyin.",
                "Kendi bünyenizdeki restoran/spa için dışarıdan gelenlere özel 'Day Pass' satın."
            ]
            
        # 5. Services & Repair (Car Repair, Laundry, Electrician)
        elif any(t in types for t in ["car_repair", "laundry", "electrician", "plumber", "painter"]):
            return [
                "Hizmet sürecini canlı izleyebilecekleri 'İş Takip' bildirim sistemi kurun.",
                "Yıllık 'Bakım Aboneliği' (Subscription) modeli ile nakit akışını stabilize edin.",
                "Yapılan iş için 'Dijital Garanti Belgesi' ve servis geçmişi portalı sunun.",
                "Kapıdan alıp kapıya teslim (Valet) modelini tüm hizmetlere entegre edin.",
                "Acil durumlar için '60 Dakikada Müdahale' premium servisi başlatın.",
                "Müşterilerinizin ev/araç bakım zamanlarını hatırlatan otomatik SMS sistemi kurun."
            ]

        # 6. Corporate & Industry (Holding, Factory, Warehouse)
        elif any(t in types for t in ["establishment", "factory", "warehouse", "logistics"]):
            return [
                "Tedarik zinciri şeffaflığı için 'Müşteri İzleme Paneli' (Dashboard) kurun.",
                "Endüstriyel 4.0 dönüşümü için IoT tabanlı üretim izleme verilerini pazarlamada kullanın.",
                "B2B müşterileri için 'Otomatik Yeniden Sipariş' (Auto-stock) entegrasyonu sunun.",
                "Çalışan memnuniyetini ve İSG standartlarını öne çıkararak 'İşveren Markası' yaratın.",
                "Sektörel 'Whitepaper' ve 'Pazar Analizleri' yayınlayarak otorite konumuna geçin.",
                "Global pazarlar için çok dilli profesyonel bir 'E-Katalog' ve 'Teklif Sihirbazı' oluşturun."
            ]

        # Default fallback (Retail & Others)
        return [
            "Mağaza içi trafiği artırmak için 'Click & Collect' (Online al, mağazadan al) modeline geçin.",
            "QR kod ile anında Google Yorum toplama standları kurun.",
            "Bölgedeki tamamlayıcı işletmelerle 'Hediye Çeki' işbirlikleri yapın.",
            "Veri madenciliği ile müşterilerinize doğum günlerinde kişiselleştirilmiş teklifler gönderin.",
            "Abonelik modeli ile düzenli ürün/hizmet alımını teşvik edin.",
            "Yapay zeka destekli stok yönetim sistemi ile kayıpları minimize edin."
        ]


    def calculate_profile_vitals(self, details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate health score based on profile completeness and technical SEO.
        """
        checks = {
            "has_website": bool(details.get("website")),
            "has_phone": bool(details.get("formatted_phone_number")),
            "has_photos": len(details.get("photos", [])) > 5,
            "has_reviews": details.get("user_ratings_total", 0) > 10,
            "has_opening_hours": bool(details.get("opening_hours")),
            "is_verified": details.get("business_status") == "OPERATIONAL"
        }
        
        passed = sum(1 for v in checks.values() if v)
        completeness = (passed / len(checks)) * 100
        
        return {
            "health_score": completeness,
            "completeness": completeness,
            "checks": checks
        }

    def _generate_summary(self, score: float, recommendations: list, is_my_business: bool = False) -> str:
        if is_my_business:
            if score >= 85: return "Harika iş! İşletmeniz bölgenin en iyileri arasında."
            if score >= 60: return "İyi bir yoldasınız ancak zirve için atmanız gereken adımlar var."
            return "İşletmenizin dijital varlığı zayıf görünüyor. Acil müdahale gerekli."
        else:
            if score >= 85: return f"Bu rakip çok dişli ({score}/100). Onu geçmek için kusursuz bir Google optimizasyonu lazım."
            if score >= 60: return "Bu işletmeyi doğru hamlelerle (hızlı yanıt, yeni fotolar) geçmeniz çok orta vadede mümkün."
            return "Bu zayıf bir rakip. Basit optimizasyonlarla onu sıralamada kolayca geride bırakabilirsiniz."

ranking_engine = RankingEngine()
