from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as ReportLabImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO
from app.models import Business, User
from datetime import datetime

class ReportService:
    def generate_business_report(self, business: Business, user: User) -> BytesIO:
        """
        Generates a PDF report for a business.
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # -- Header (White Label) --
        # Ideally, we'd fetch the generic "Agency" logo if configured, or MapRank logo
        title_style = styles["Title"]
        story.append(Paragraph(f"Performance Report: {business.name}", title_style))
        story.append(Spacer(1, 12))
        
        meta_style = ParagraphStyle('Meta', parent=styles['Normal'], textColor=colors.gray)
        story.append(Paragraph(f"Generated for: {user.full_name or user.email}", meta_style))
        story.append(Paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}", meta_style))
        story.append(Spacer(1, 24))

        # -- Current Ranking --
        story.append(Paragraph("Current Search Ranking", styles["Heading2"]))
        rank = business.latest_ranking.rank_position if business.latest_ranking else "N/A"
        score = business.latest_ranking.map_rank_score if business.latest_ranking else "N/A"
        
        data = [
            ["Metric", "Value"],
            ["Rank Position", f"#{rank}"],
            ["MapRank Score", f"{score}/100"],
            ["Total Reviews", business.total_reviews or "N/A"],
            ["Average Rating", f"{business.average_rating or 'N/A'} ⭐"]
        ]
        
        t = Table(data, colWidths=[200, 200])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.indigo),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(t)
        story.append(Spacer(1, 24))

        # -- AI Insights (Mock) --
        story.append(Paragraph("AI Performance Insights", styles["Heading2"]))
        insight_text = (
            "Your business is performing well in local search results. "
            "To improve your MapRank Score, focus on generating more reviews with keywords "
            "related to your primary services. Competitor analysis suggests that responding "
            "faster to negative reviews could boost your conversion rate by 15%."
        )
        story.append(Paragraph(insight_text, styles["Normal"]))

        # -- Footer --
        story.append(Spacer(1, 48))
        footer_text = "Powered by MapRank SaaS - White Label Solution"
        story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.gray, alignment=1)))

        doc.build(story)
        buffer.seek(0)
        return buffer

report_service = ReportService()
