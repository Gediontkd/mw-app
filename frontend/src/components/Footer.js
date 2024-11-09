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
          <img src={JoinUsImage} alt="Join Us" className="join-us-image" />
          <div className="footer-links">
            <button className="footer-button">FAQ's</button>
            <button className="footer-button">Terms and Conditions</button>
            <button className="footer-button">Privacy Policy</button>
            <button className="footer-button">Cookie Policy</button>
          </div>
        </div>

        {/* Middle Section - Text with Partner Logos */}
        <div className="footer-middle">
          <p className="footer-text">
            EgameX: innovative platform dedicated to the community<br />
            and coaching of the gaming world.
          </p>
          <p className="footer-text">
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
            <a href="https://discord.com/invite/xtZFtMKZez" className="social-icon"><MessageCircle size={24} /></a>
            <a href="https://twitter.com/eGameX_Official/" className="social-icon"><TwitterIcon size={24} /></a>
            <a href="https://www.instagram.com/egamex.eu/" className="social-icon"><InstagramIcon size={24} /></a>
            <a href="https://www.facebook.com/profile.php?id=100087924018776/" className="social-icon"><FacebookIcon size={24} /></a>
            <a href="https://www.linkedin.com/company/egamexofficial/" className="social-icon"><LinkedinIcon size={24} /></a>
            <a href="https://www.tiktok.com/@egamex_official?is_from_webapp=1&sender_device=pc/" className="social-icon"><Video size={24} /></a>
          </div>
          <p className="copyright">© 2024 EGAMEX ALL RIGHTS RESERVED</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;