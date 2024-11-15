import React from 'react';
import './Footer.css';
import JoinUsImage from '../assets/images/banner_discord.png';
import PartnerLogosImage from '../assets/images/preseed_banner.png'; // Add this import
import { 
  MessageCircle, 
  TwitterIcon, 
  InstagramIcon, 
  FacebookIcon, 
  LinkedinIcon,
  Video 
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Left Section - Join Us Image */}
        <div className="footer-left">
        <a href="https://discord.com/invite/xtZFtMKZez">
  <img src={JoinUsImage} alt="Join Us" className="join-us-image" />
</a>
<div className="footer-links">
  <a href="#" className="footer-button">FAQ's</a>
  <a href="https://www.iubenda.com/terms-and-conditions/81959053" className="footer-button">Terms and Conditions</a>
  <a href="https://www.iubenda.com/privacy-policy/81959053" className="footer-button">Privacy Policy</a>
  <a href="https://www.iubenda.com/privacy-policy/81959053/cookie-policy" className="footer-button">Cookie Policy</a>
</div>
        </div>

        {/* Middle Section - Text with Partner Logos */}
        <div className="footer-middle">
          <p className="footer-text">
            EgameX: innovative platform dedicated to the community<br />
            and coaching of the gaming world. <br/>
            Project funded by the Lazio Region, with a contribution of<br />
            €30,000 through the POR FESR Pre Seed Plus call.
          </p>
          {/* Partner Logos moved here */}
          <div className="partner-logos">
            <img 
              src={PartnerLogosImage} 
              alt="Partner Logos" 
              className="partner-logos-image"
            />
          </div>
        </div>

        {/* Right Section - Social Links */}
        <div className="footer-right">
          <h3 className="follow-us">FOLLOW US</h3>
          <div className="social-icons">
  {[
    { icon: <MessageCircle size={28} />, href: "https://discord.com/invite/xtZFtMKZez" },
    { icon: <TwitterIcon size={28} />, href: "https://twitter.com/eGameX_Official/" },
    { icon: <InstagramIcon size={28} />, href: "https://www.instagram.com/egamex.eu/" },
    { icon: <FacebookIcon size={28} />, href: "https://www.facebook.com/profile.php?id=100087924018776/" },
    { icon: <LinkedinIcon size={28} />, href: "https://www.linkedin.com/company/egamexofficial/" },
    { icon: <Video size={28} />, href: "https://www.tiktok.com/@egamex_official?is_from_webapp=1&sender_device=pc/" }
  ].map((item, index) => (
    <a 
      key={index} 
      href={item.href} 
      className="social-icon" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      {item.icon}
    </a>
  ))}
</div>
          <p className="copyright">© 2024 EGAMEX ALL RIGHTS RESERVED</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;