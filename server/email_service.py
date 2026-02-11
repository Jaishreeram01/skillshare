import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, From
from typing import Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.api_key = os.getenv("SENDGRID_API_KEY")
        self.from_email = os.getenv("FROM_EMAIL", "skillsharetest0107@gmail.com")
        self.sg = SendGridAPIClient(self.api_key)
        
    def _send_email(self, to_email: str, subject: str, html_content: str):
        """Send email using SendGrid"""
        try:
            message = Mail(
                from_email=From(self.from_email, "SkillShare"),
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            response = self.sg.send(message)
            logger.info(f"Email sent successfully to {to_email}. Status: {response.status_code}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            # Fallback: Log the email content for development/testing
            logger.info(f"--- MOCK EMAIL TO {to_email} ---")
            logger.info(f"Subject: {subject}")
            logger.info(f"Content: {html_content[:500]}...") # Log first 500 chars
            logger.info("--------------------------------")
            return False
    
    def _get_base_template(self, content: str) -> str:
        """Base template with SkillShare sketch theme"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{ 
                    font-family: 'Inter', Arial, sans-serif; 
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    padding: 20px;
                }}
                .email-container {{ 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white;
                    border: 3px solid #1a1a1a;
                    box-shadow: 8px 8px 0px #1a1a1a;
                    position: relative;
                }}
                .tape {{ 
                    position: absolute;
                    width: 80px;
                    height: 25px;
                    background: rgba(255, 220, 100, 0.7);
                    border: 1px solid rgba(0,0,0,0.1);
                    top: -12px;
                    left: 50%;
                    transform: translateX(-50%) rotate(-2deg);
                    z-index: 10;
                }}
                .header {{ 
                    background: linear-gradient(135deg, #FFE66D 0%, #FFC93C 100%);
                    padding: 40px 30px;
                    border-bottom: 3px solid #1a1a1a;
                    position: relative;
                    overflow: hidden;
                }}
                .header::before {{
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 10px,
                        rgba(255,255,255,0.1) 10px,
                        rgba(255,255,255,0.1) 20px
                    );
                }}
                .header h1 {{ 
                    font-family: 'Caveat', cursive;
                    font-size: 48px;
                    color: #1a1a1a;
                    text-align: center;
                    transform: rotate(-2deg);
                    position: relative;
                    z-index: 1;
                    text-shadow: 3px 3px 0px rgba(255,255,255,0.5);
                }}
                .content {{ 
                    padding: 40px 30px;
                    background: #FFFEF9;
                }}
                .content h2 {{
                    font-family: 'Caveat', cursive;
                    font-size: 32px;
                    color: #1a1a1a;
                    margin-bottom: 20px;
                    transform: rotate(-1deg);
                }}
                .content p {{
                    font-size: 16px;
                    line-height: 1.8;
                    color: #333;
                    margin-bottom: 15px;
                }}
                .card {{
                    background: white;
                    border: 3px solid #1a1a1a;
                    padding: 25px;
                    margin: 25px 0;
                    box-shadow: 4px 4px 0px #1a1a1a;
                    transform: rotate(-1deg);
                }}
                .card h3 {{
                    font-family: 'Caveat', cursive;
                    font-size: 28px;
                    color: #1a1a1a;
                    margin-bottom: 15px;
                }}
                .button {{
                    display: inline-block;
                    padding: 15px 35px;
                    background: #6C63FF;
                    color: white !important;
                    text-decoration: none;
                    font-weight: 700;
                    font-size: 18px;
                    border: 3px solid #1a1a1a;
                    box-shadow: 4px 4px 0px #1a1a1a;
                    transform: rotate(-1deg);
                    transition: all 0.2s;
                    margin: 20px 0;
                    font-family: 'Caveat', cursive;
                }}
                .button:hover {{
                    transform: rotate(-1deg) translateY(-2px);
                    box-shadow: 6px 6px 0px #1a1a1a;
                }}
                .badge {{
                    display: inline-block;
                    padding: 8px 15px;
                    background: #FFE66D;
                    border: 2px solid #1a1a1a;
                    font-weight: 700;
                    font-size: 14px;
                    margin: 5px;
                    transform: rotate(1deg);
                    box-shadow: 2px 2px 0px #1a1a1a;
                }}
                .footer {{
                    background: #f5f5f5;
                    padding: 30px;
                    text-align: center;
                    border-top: 3px solid #1a1a1a;
                    font-size: 14px;
                    color: #666;
                }}
                .emoji {{
                    font-size: 32px;
                    display: inline-block;
                    animation: bounce 2s infinite;
                }}
                @keyframes bounce {{
                    0%, 100% {{ transform: translateY(0); }}
                    50% {{ transform: translateY(-10px); }}
                }}
                ul {{
                    list-style: none;
                    padding-left: 0;
                }}
                ul li {{
                    padding: 10px 0;
                    font-size: 16px;
                    position: relative;
                    padding-left: 30px;
                }}
                ul li:before {{
                    content: '✏️';
                    position: absolute;
                    left: 0;
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="tape"></div>
                {content}
            </div>
        </body>
        </html>
        """
    
    def send_welcome_email(self, user_email: str, user_name: str):
        """Send welcome email to new user"""
        subject = "Welcome to SkillShare! 🎉"
        
        content = f"""
        <div class="header">
            <h1>Welcome to SkillShare! <span class="emoji">🎉</span></h1>
        </div>
        <div class="content">
            <h2>Hey {user_name}! 👋</h2>
            <p>We're <strong>super excited</strong> to have you join our community of learners and makers!</p>
            
            <div class="card">
                <h3>🚀 Let's Get Started!</h3>
                <ul>
                    <li><strong>Complete your profile</strong> - Tell us about yourself</li>
                    <li><strong>Add your skills</strong> - What can you teach?</li>
                    <li><strong>Set learning goals</strong> - What do you want to learn?</li>
                    <li><strong>Find matches</strong> - Connect with awesome people</li>
                    <li><strong>Schedule sessions</strong> - Start learning & teaching!</li>
                </ul>
            </div>
            
            <center>
                <a href="http://localhost:5173/dashboard" class="button">Go to Dashboard →</a>
            </center>
            
            <p style="margin-top: 30px;">Ready to create something amazing? Let's do this! 💪</p>
            <p><strong>Happy Learning,<br>The SkillShare Team</strong></p>
        </div>
        <div class="footer">
            <p>© 2026 SkillShare • Building skills together, one session at a time</p>
        </div>
        """
        
        html_content = self._get_base_template(content)
        return self._send_email(user_email, subject, html_content)
    
    def send_session_confirmation(self, session_data: dict, recipient_email: str, recipient_name: str, is_teacher: bool):
        """Send session confirmation email"""
        role = "Teacher 👨‍🏫" if is_teacher else "Learner 📚"
        other_role = "Learner" if is_teacher else "Teacher"
        
        subject = f"Session Confirmed: {session_data.get('topic')} 📅"
        
        scheduled_time = session_data.get('scheduledAt')
        if isinstance(scheduled_time, str):
            try:
                scheduled_time = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
            except:
                scheduled_time = None
        
        formatted_time = scheduled_time.strftime("%B %d, %Y at %I:%M %p") if scheduled_time else "TBD"
        
        content = f"""
        <div class="header">
            <h1>Session Confirmed! <span class="emoji">✅</span></h1>
        </div>
        <div class="content">
            <h2>Hi {recipient_name}!</h2>
            <p>Your session is all set and ready to go! 🎯</p>
            
            <div class="card">
                <h3>📚 {session_data.get('topic')}</h3>
                <p><strong>Your Role:</strong> <span class="badge">{role}</span></p>
                <p><strong>{other_role}:</strong> {session_data.get('partnerName', 'TBD')}</p>
                <p><strong>📅 When:</strong> {formatted_time}</p>
                <p><strong>⏱️ Duration:</strong> {session_data.get('duration', 60)} minutes</p>
                {f'<p><strong>🔗 Meet Link:</strong> <a href="{session_data.get("meetLink")}" style="color: #6C63FF; font-weight: 700;">{session_data.get("meetLink")}</a></p>' if session_data.get('meetLink') else '<p><strong>🔗 Meet Link:</strong> Will be shared soon</p>'}
            </div>
            
            <center>
                <a href="http://localhost:5173/dashboard/sessions" class="button">View Session →</a>
            </center>
            
            <p style="margin-top: 30px;">We'll send you a reminder 24 hours before the session. See you there! 🚀</p>
            <p><strong>Happy Learning,<br>The SkillShare Team</strong></p>
        </div>
        <div class="footer">
            <p>© 2026 SkillShare • Building skills together, one session at a time</p>
        </div>
        """
        
        html_content = self._get_base_template(content)
        return self._send_email(recipient_email, subject, html_content)
    
    def send_project_invitation(self, project_data: dict, invitee_email: str, invitee_name: str, inviter_name: str):
        """Send project invitation email"""
        subject = f"Project Invite: {project_data.get('title')} 🚀"
        
        tech_badges = ''.join([f'<span class="badge">{tech}</span>' for tech in project_data.get('stack', [])])
        
        content = f"""
        <div class="header">
            <h1>Project Invitation! <span class="emoji">🚀</span></h1>
        </div>
        <div class="content">
            <h2>Hey {invitee_name}!</h2>
            <p><strong>{inviter_name}</strong> thinks you'd be perfect for their project! 🎯</p>
            
            <div class="card">
                <h3>{project_data.get('title')}</h3>
                <p>{project_data.get('description')}</p>
                
                <p style="margin-top: 20px;"><strong>Tech Stack:</strong></p>
                <div>{tech_badges}</div>
                
                <p style="margin-top: 15px;">
                    <strong>Difficulty:</strong> <span class="badge">{project_data.get('difficulty', 'Intermediate')}</span>
                    <strong>Type:</strong> <span class="badge">{project_data.get('type', 'Web Development')}</span>
                </p>
            </div>
            
            <center>
                <a href="http://localhost:5173/dashboard/projects" class="button">View Project →</a>
            </center>
            
            <p style="margin-top: 30px;">Join now and start building something awesome together! 💪</p>
            <p><strong>Happy Building,<br>The SkillShare Team</strong></p>
        </div>
        <div class="footer">
            <p>© 2026 SkillShare • Building skills together, one session at a time</p>
        </div>
        """
        
        html_content = self._get_base_template(content)
        return self._send_email(invitee_email, subject, html_content)
    
    def send_mutual_match_notification(self, match_data: dict, user_email: str, user_name: str):
        """Send mutual match notification email"""
        subject = f"New Match: {match_data.get('matchName')} 🎯"
        
        teaches_badges = ''.join([f'<span class="badge">{skill}</span>' for skill in match_data.get('teaches', [])])
        wants_badges = ''.join([f'<span class="badge">{skill}</span>' for skill in match_data.get('wants', [])])
        
        content = f"""
        <div class="header">
            <h1>New Match Found! <span class="emoji">🎯</span></h1>
        </div>
        <div class="content">
            <h2>Hi {user_name}!</h2>
            <p>Great news! We found someone perfect for you! 🌟</p>
            
            <div class="card">
                <h3>{match_data.get('matchName')}</h3>
                <p><strong>Match Score:</strong> <span class="badge" style="background: #4CAF50; color: white;">{match_data.get('matchScore', 0)}%</span></p>
                
                <p style="margin-top: 20px;"><strong>They can teach:</strong></p>
                <div>{teaches_badges}</div>
                
                <p style="margin-top: 15px;"><strong>They want to learn:</strong></p>
                <div>{wants_badges}</div>
            </div>
            
            <center>
                <a href="http://localhost:5173/dashboard/matches" class="button">View Match →</a>
            </center>
            
            <p style="margin-top: 30px;">Don't wait! Reach out and schedule your first session together! 🚀</p>
            <p><strong>Happy Matching,<br>The SkillShare Team</strong></p>
        </div>
        <div class="footer">
            <p>© 2026 SkillShare • Building skills together, one session at a time</p>
        </div>
        """
        
        html_content = self._get_base_template(content)
        return self._send_email(user_email, subject, html_content)

# Create singleton instance
email_service = EmailService()
