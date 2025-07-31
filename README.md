# InvestiScope™ Classic Calculator

This is the standalone version of the InvestiScope™ Classic Calculator, extracted from the main InvestInPuglia.eu website to improve performance.

## 🚀 Features

- Advanced Mini PIA Turismo grant calculations
- Real-time financial projections
- PDF report generation
- WhatsApp integration for instant sharing
- Professional cost analysis
- Supabase integration for lead tracking

## 🛠️ Deployment

This project is designed to be deployed on Netlify at `classic.investinpuglia.eu`.

### Setup Instructions:

1. **Deploy to Netlify**
   - Connect this repository to Netlify
   - Deploy will happen automatically

2. **Configure Domain**
   - In Netlify settings, add custom domain: `classic.investinpuglia.eu`
   - Configure DNS CNAME record pointing to your Netlify app

3. **Copy Favicon**
   - Copy `favicon.ico` from the main website to this repository

## 📁 File Structure

```
classic.investinpuglia.eu/
├── index.html          # Main HTML structure
├── styles.css          # All CSS styles
├── script.js           # JavaScript functionality
├── netlify.toml        # Netlify configuration
├── favicon.ico         # Site favicon (copy from main site)
└── README.md           # This file
```

## 🔗 Integration with Main Site

The main InvestInPuglia.eu website links to this calculator from:
- Navigation menu
- Calculator page
- Tools page

## 🔐 Access Control

The calculator requires users to register first at `/classic/register` on the main site. Access is controlled via localStorage tokens.

## 🎯 Performance

By hosting the calculator separately, we achieve:
- Faster load times on the main site
- Better SEO scores
- Reduced Total Blocking Time
- Improved user experience

## 📞 Support

For issues or questions:
- Email: info@investinpuglia.eu
- Phone: +39 351 400 1402

---

© 2024 M&T International. All rights reserved.
