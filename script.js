// classic.investinpuglia.eu/script.js
// Configuration
const SUPABASE_URL = 'https://kjyobkrjcmiuusijvrme.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeW9ia3JqY21pdXVzaWp2cm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NDM5NzMsImV4cCI6MjA2NjUxOTk3M30.2GxAUtXPal7ufxg7KgWMO7h15RXJOolBWt0-NPygj2I';
const EMAILJS_SERVICE_ID = 'service_w6tghqr';
const EMAILJS_TEMPLATE_ID = 'template_vztws4q';
const EMAILJS_PUBLIC_KEY = 'wKn1_xMCtZssdZzpb';

// Firebase Configuration
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD5W53Mh-RqugrgyaALsf4ERPKHNiEF4BM",
  authDomain: "invest-in-puglia-eu.firebaseapp.com",
  projectId: "invest-in-puglia-eu",
  storageBucket: "invest-in-puglia-eu.firebasestorage.app",
  messagingSenderId: "515852973978",
  appId: "1:515852973978:web:68df8862710f0b89df5423"
};

// Initialize services
let supabase;
let calculationResults = {};
let currentUser = null;
let dynamicConfig = null;

// Helper function
function getConfigValue(path, defaultValue) {
  if (!dynamicConfig) return defaultValue;
  try {
    const keys = path.split('.');
    let value = dynamicConfig;
    for (const key of keys) {
      value = value[key];
    }
    return value !== undefined ? value : defaultValue;
  } catch {
    return defaultValue;
  }
}

window.addEventListener('load', async function() {
  // Initialize Firebase
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(FIREBASE_CONFIG);
    const auth = firebase.auth();
    
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('User authenticated:', user.email);
        currentUser = user;
        localStorage.setItem('investiscope_user_email', user.email);
        localStorage.setItem('investiscope_access_token', 'firebase_auth');
        initializeCalculator();
      } else {
        console.log('No authenticated user, running in demo mode');
        // Run without authentication for local testing
        initializeCalculator();
      }
    });
  } else {
    console.log('Firebase not loaded, running in demo mode');
    // Run without Firebase for local testing
    initializeCalculator();
  }
});

function initializeCalculator() {
  if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase initialized');
  }
  if (window.emailjs) {
    window.emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('EmailJS initialized');
  }
  loadDynamicConfig();
}


// Load dynamic configuration (but don't break if it fails)
async function loadDynamicConfig() {
  try {
    const response = await fetch('https://investinpuglia.eu/api/calculator/config');
    const config = await response.json();
    if (config) {
      console.log('Loaded dynamic config from Sanity');
      dynamicConfig = config;
      // Update sliders with dynamic min/max values
      updateSliderRanges();
    }
  } catch (err) {
    console.log('Using default config values');
  }
  
  // Initialize calculations
  updateCalculations();
}

// Constants - Use dynamic values if available
const inputs = {
  propertyPurchase: document.getElementById('propertyPurchaseInput'),
  restructuring: document.getElementById('restructuringInput'),
  fixtures: document.getElementById('fixturesInput'),
  innovation: document.getElementById('innovationInput'),
  environmental: document.getElementById('environmentalInput'),
  grantRate: document.getElementById('grantRateInput'),
  agencyFees: document.getElementById('agencyFeesInput'),
  notaryFees: document.getElementById('notaryFeesInput'),
  consultingFees: document.getElementById('consultingFeesInput')
};

const displays = {
  propertyPurchase: document.getElementById('propertyPurchaseValue'),
  restructuring: document.getElementById('restructuringValue'),
  fixtures: document.getElementById('fixturesValue'),
  innovation: document.getElementById('innovationValue'),
  environmental: document.getElementById('environmentalValue'),
  designPm: document.getElementById('designPmValue'),
  preliminaryStudies: document.getElementById('preliminaryStudiesValue'),
  grantRate: document.getElementById('grantRateValue'),
  integratedTotal: document.getElementById('integratedTotal'),
  integratedPercent: document.getElementById('integratedPercent'),
  integratedStatus: document.getElementById('integratedStatus'),
  totalEligible: document.getElementById('totalEligibleDisplay'),
  miniPiaGrant: document.getElementById('miniPiaGrantDisplay'),
  taxCredit: document.getElementById('taxCreditDisplay'),
  totalBenefit: document.getElementById('totalBenefitDisplay'),
  agencyFees: document.getElementById('agencyFeesValue'),
  registrationTax: document.getElementById('registrationTaxValue'),
  notaryFees: document.getElementById('notaryFeesValue'),
  consultingFees: document.getElementById('consultingFeesValue'),
  totalNonEligible: document.getElementById('totalNonEligibleDisplay'),
  totalProject: document.getElementById('totalProjectDisplay'),
  netInvestment: document.getElementById('netInvestmentDisplay')
};

// Add event listeners
for (const key in inputs) {
  if (inputs[key]) {
    inputs[key].addEventListener('input', updateCalculations);
  }
}

// Add cost checkbox listeners
const costCheckboxes = ['cost-notaryFees', 'cost-legalFees', 'cost-architectFees', 'cost-permitCosts', 'cost-projectManagement'];
costCheckboxes.forEach(id => {
  const checkbox = document.getElementById(id);
  if (checkbox) {
    checkbox.addEventListener('change', updateProfessionalCosts);
  }
});

// Update slider ranges with dynamic config
function updateSliderRanges() {
  if (inputs.propertyPurchase) {
    inputs.propertyPurchase.min = getConfigValue('parameters.propertyValue.min', 100000);
    inputs.propertyPurchase.max = getConfigValue('parameters.propertyValue.max', 3000000);
    inputs.propertyPurchase.step = getConfigValue('parameters.propertyValue.step', 10000);
  }
  
  if (inputs.restructuring) {
    inputs.restructuring.min = getConfigValue('parameters.renovationBudget.min', 50000);
    inputs.restructuring.max = getConfigValue('parameters.renovationBudget.max', 2000000);
    inputs.restructuring.step = getConfigValue('parameters.renovationBudget.step', 10000);
  }
}

function formatCurrency(value) {
  // Simple solution - no euro symbol, just formatted number
  return Math.round(value).toLocaleString('en-US');
}

function updateCalculations() {
  // Get input values
  const propertyPurchase = parseFloat(inputs.propertyPurchase.value);
  const restructuring = parseFloat(inputs.restructuring.value);
  const fixtures = parseFloat(inputs.fixtures.value);
  const innovation = parseFloat(inputs.innovation.value);
  const environmental = parseFloat(inputs.environmental.value);
  const grantRate = parseFloat(inputs.grantRate.value) / 100; // Convert percentage to decimal
  
  // Update display values
  displays.propertyPurchase.textContent = formatCurrency(propertyPurchase);
  displays.restructuring.textContent = formatCurrency(restructuring);
  displays.fixtures.textContent = formatCurrency(fixtures);
  displays.innovation.textContent = formatCurrency(innovation);
  displays.environmental.textContent = formatCurrency(environmental);
  displays.grantRate.textContent = Math.round(grantRate * 100) + '%';
  
  // Update suggestions
  const fixturesSuggestion = restructuring * 0.125;
  document.getElementById('fixturesSuggestion').textContent = 'Suggested: 12.5% of civil works (' + formatCurrency(fixturesSuggestion) + ')';
  
  // Calculate design & PM (use dynamic rate if available)
  const designPmRate = getConfigValue('parameters.costs.designAndPM.percent', 6) / 100;
  const designPm = restructuring * designPmRate;
  displays.designPm.textContent = formatCurrency(designPm);
  
  // Update design PM note - use simple 'x' for multiplication
  document.getElementById('designPmNote').textContent = 
    (designPmRate * 100) + '% x ' + formatCurrency(restructuring) + ' (renovations) = ' + formatCurrency(designPm);
  
  // Calculate integrated components
  const integratedTotal = innovation + environmental;
  displays.integratedTotal.textContent = formatCurrency(integratedTotal);
  
  // Calculate preliminary total (before preliminary studies)
  const preliminaryTotal = propertyPurchase + restructuring + fixtures + innovation + environmental + designPm;
  
  // Calculate preliminary studies (use dynamic rate if available)
  const preliminaryRate = getConfigValue('parameters.costs.preliminaryStudies.percent', 1.5) / 100;
  // This creates a circular calculation: studies = 1.5% of (total including studies)
  // So: studies = 0.015 * (preliminary + studies)
  // studies = 0.015 * preliminary / (1 - 0.015)
  const preliminaryStudies = (preliminaryTotal * preliminaryRate) / 
                           (1 - preliminaryRate);
  displays.preliminaryStudies.textContent = formatCurrency(preliminaryStudies);
  
  // Calculate total eligible
  const totalEligible = preliminaryTotal + preliminaryStudies;
  displays.totalEligible.textContent = formatCurrency(totalEligible);
  
  // Calculate integrated percentage
  const integratedPercent = (integratedTotal / totalEligible) * 100;
  displays.integratedPercent.textContent = integratedPercent.toFixed(1) + '%';
  
  // Update integrated components status (use dynamic minimum if available)
  const minIntegrated = getConfigValue('parameters.components.innovation.minPercent', 2) + 
                       getConfigValue('parameters.components.sustainability.minPercent', 2);
  
  if (integratedPercent >= minIntegrated) {
    displays.integratedStatus.textContent = 'YES - Meets minimum ' + minIntegrated + '% requirement';
    displays.integratedStatus.style.color = '#059669';
  } else {
    displays.integratedStatus.textContent = 'NO - Below minimum ' + minIntegrated + '% requirement';
    displays.integratedStatus.style.color = '#dc2626';
  }
  
  // Calculate grant and tax credit
  const miniPiaGrant = totalEligible * grantRate;
  const taxCredit = totalEligible * 0.15; // 15% tax credit
  const totalBenefit = miniPiaGrant + taxCredit;
  
  displays.miniPiaGrant.textContent = formatCurrency(miniPiaGrant);
  displays.taxCredit.textContent = formatCurrency(taxCredit);
  displays.totalBenefit.textContent = formatCurrency(totalBenefit);
  
  // Calculate non-eligible costs
  const agencyRate = parseFloat(inputs.agencyFees.value) / 100;
  const agencyFees = propertyPurchase * agencyRate;
  const registrationTax = propertyPurchase * 0.09; // 9% registration tax
  const notaryFees = parseFloat(inputs.notaryFees.value);
  const consultingFees = parseFloat(inputs.consultingFees.value);
  
  // Update non-eligible displays
  displays.agencyFees.textContent = formatCurrency(agencyFees);
  displays.registrationTax.textContent = formatCurrency(registrationTax);
  displays.notaryFees.textContent = formatCurrency(notaryFees);
  displays.consultingFees.textContent = formatCurrency(consultingFees);
  document.getElementById('agencyRateDisplay').textContent = agencyRate.toFixed(1) + '%';
  
  // Calculate totals
  const totalNonEligible = agencyFees + registrationTax + notaryFees + consultingFees;
  const totalProject = totalEligible + totalNonEligible;
  const netInvestment = totalProject - totalBenefit;
  
  displays.totalNonEligible.textContent = formatCurrency(totalNonEligible);
  displays.totalProject.textContent = formatCurrency(totalProject);
  displays.netInvestment.textContent = formatCurrency(netInvestment);
  
  // Update preview values
  document.getElementById('previewGrant').textContent = formatCurrency(miniPiaGrant);
  document.getElementById('previewBenefit').textContent = formatCurrency(totalBenefit);
  document.getElementById('previewNet').textContent = formatCurrency(netInvestment);
  document.getElementById('previewTotal').textContent = formatCurrency(totalProject);
  
  // Store results for PDF and WhatsApp
  calculationResults = {
    propertyPurchase,
    restructuring,
    fixtures,
    innovation,
    environmental,
    designPm,
    preliminaryStudies,
    totalEligible,
    miniPiaGrant,
    taxCredit,
    totalBenefit,
    agencyFees,
    registrationTax,
    notaryFees,
    consultingFees,
    totalNonEligible,
    totalProject,
    netInvestment,
    integratedPercent,
    grantRate: grantRate * 100
  };
  
  // Update professional costs
  updateProfessionalCosts();
}

// Update professional costs
function updateProfessionalCosts() {
  const propertyPrice = parseFloat(inputs.propertyPurchase.value);
  const renovationBudget = parseFloat(inputs.restructuring.value);
  let total = 0;
  
  // Notary fees
  if (document.getElementById('cost-notaryFees').checked) {
    const cost = Math.min(Math.max(propertyPrice * 0.02, 1500), 15000);
    document.getElementById('value-notaryFees').textContent = formatCurrency(cost);
    total += cost;
  } else {
    document.getElementById('value-notaryFees').textContent = '0';
  }
  
  // Legal fees
  if (document.getElementById('cost-legalFees').checked) {
    const cost = Math.min(Math.max(propertyPrice * 0.015, 2000), 10000);
    document.getElementById('value-legalFees').textContent = formatCurrency(cost);
    total += cost;
  } else {
    document.getElementById('value-legalFees').textContent = '0';
  }
  
  // Architect fees
  if (document.getElementById('cost-architectFees').checked) {
    const cost = Math.max(renovationBudget * 0.08, 5000);
    document.getElementById('value-architectFees').textContent = formatCurrency(cost);
    total += cost;
  } else {
    document.getElementById('value-architectFees').textContent = '0';
  }
  
  // Permits
  if (document.getElementById('cost-permitCosts').checked) {
    const cost = 5000;
    document.getElementById('value-permitCosts').textContent = formatCurrency(cost);
    total += cost;
  } else {
    document.getElementById('value-permitCosts').textContent = '0';
  }
  
  // Project management
  if (document.getElementById('cost-projectManagement').checked) {
    const cost = Math.max(renovationBudget * 0.05, 5000);
    document.getElementById('value-projectManagement').textContent = formatCurrency(cost);
    total += cost;
  } else {
    document.getElementById('value-projectManagement').textContent = '0';
  }
  
  document.getElementById('total-professional-costs').textContent = formatCurrency(total);
  calculationResults.professionalCosts = total;
}

// Modal functions
window.showRegistrationModal = function() {
  document.getElementById('registrationOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

window.closeModal = function() {
  document.getElementById('registrationOverlay').style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
document.getElementById('registrationOverlay').addEventListener('click', function(e) {
  if (e.target === this) {
    closeModal();
  }
});

// Handle form submission
window.handleRegistration = async function(event) {
  event.preventDefault();
  
  const formData = {
    name: document.getElementById('userName').value,
    email: document.getElementById('userEmail').value,
    phone: document.getElementById('userPhone').value || 'Not provided',
    location: document.getElementById('propertyLocation').value || 'Not specified',
    timeline: document.getElementById('investmentTimeline').value || 'Not specified',
    calculations: calculationResults,
    timestamp: new Date().toISOString()
  };
  
  // Store lead in Supabase if available
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('calculator_leads')
        .insert([formData]);
      
      if (error) {
        console.error('Supabase error:', error);
      } else {
        console.log('Lead saved to Supabase');
      }
    } catch (err) {
      console.error('Failed to save to Supabase:', err);
    }
  }
  
  // Send email notification if EmailJS is available
  if (window.emailjs) {
    try {
      const templateParams = {
        to_email: 'info@marietrulli.com',
        from_name: formData.name,
        from_email: formData.email,
        phone: formData.phone,
        location: formData.location,
        timeline: formData.timeline,
        total_project: formatCurrency(calculationResults.totalProject),
        mini_pia_grant: formatCurrency(calculationResults.miniPiaGrant),
        net_investment: formatCurrency(calculationResults.netInvestment)
      };
      
      await window.emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );
      
      console.log('Email notification sent');
    } catch (err) {
      console.error('Failed to send email:', err);
    }
  }
  
  // Generate and download PDF
  try {
    generatePDFReport(formData);
    closeModal();
    showSuccessToast();
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Report generation error: ' + error.message + '\n\nPlease try the WhatsApp option instead.');
  }
  
  return false;
}

// Continue with the rest of the script...
// [PDF generation, WhatsApp, and other functions remain the same]

// Generate PDF Report - Simplified version
function generatePDFReport(userData) {
  // Create a simple text report if PDF library fails
  const reportText = `INVESTISCOPE CLASSIC REPORT
==============================
Date: ${new Date().toLocaleDateString()}
Prepared for: ${userData.name}
Email: ${userData.email}

PROJECT SUMMARY (All amounts in EUR)
====================================
Total Project Investment: ${formatCurrency(calculationResults.totalProject)}
Total Eligible Costs: ${formatCurrency(calculationResults.totalEligible)}
Total Non-Eligible Costs: ${formatCurrency(calculationResults.totalNonEligible)}

MINI PIA BENEFITS
=================
Non-Refundable Grant: ${formatCurrency(calculationResults.miniPiaGrant)}
Tax Credit (15%): ${formatCurrency(calculationResults.taxCredit)}
Total Benefit: ${formatCurrency(calculationResults.totalBenefit)}

YOUR NET INVESTMENT
==================
Net Investment Required: ${formatCurrency(calculationResults.netInvestment)}
(After all Mini PIA benefits)

ELIGIBLE COSTS BREAKDOWN
========================
Property Purchase: ${formatCurrency(calculationResults.propertyPurchase)}
Renovations: ${formatCurrency(calculationResults.restructuring)}
Fixtures & Fittings: ${formatCurrency(calculationResults.fixtures)}
Innovation: ${formatCurrency(calculationResults.innovation)}
Environmental: ${formatCurrency(calculationResults.environmental)}
Design & PM: ${formatCurrency(calculationResults.designPm)}
Studies: ${formatCurrency(calculationResults.preliminaryStudies)}

Contact: info@marietrulli.com | +39 351 400 1402
Generated by InvestiScope Classic - InvestInPuglia.eu`;

  // Try to use PDF library if available
  if (typeof jspdf !== 'undefined' && jspdf.jsPDF) {
    try {
      const { jsPDF } = jspdf;
      const doc = new jsPDF();
      
      // Simple PDF with just text
      doc.setFontSize(12);
      const lines = reportText.split('\n');
      let y = 20;
      
      lines.forEach(line => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 7;
      });
      
      doc.save('InvestiScope_Report_' + userData.name.replace(/\s+/g, '_') + '.pdf');
      return;
    } catch (e) {
      console.log('PDF generation failed, falling back to text download');
    }
  }
  
  // Fallback: Download as text file
  const blob = new Blob([reportText], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'InvestiScope_Report_' + userData.name.replace(/\s+/g, '_') + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Send WhatsApp report
window.sendWhatsAppDirect = function() {
  if (!calculationResults.totalProject) {
    alert('Please wait for calculations to complete');
    return;
  }
  
  const message = '🏠 INVESTISCOPE™ CLASSIC REPORT\n' +
    '(All amounts in EUR)\n\n' +
    '📊 PROJECT BREAKDOWN\n' +
    'Total Project: ' + formatCurrency(calculationResults.totalProject) + '\n' +
    '• Total Eligible: ' + formatCurrency(calculationResults.totalEligible) + '\n' +
    '• Total Non-Eligible: ' + formatCurrency(calculationResults.totalNonEligible) + '\n\n' +
    '💰 MINI PIA BENEFITS\n' +
    'Non-Refundable Grant: ' + formatCurrency(calculationResults.miniPiaGrant) + '\n' +
    'Tax Credit: ' + formatCurrency(calculationResults.taxCredit) + '\n' +
    'Total Benefit: ' + formatCurrency(calculationResults.totalBenefit) + '\n\n' +
    '💵 YOUR INVESTMENT\n' +
    'Net Investment Required: ' + formatCurrency(calculationResults.netInvestment) + '\n' +
    '(After Mini PIA benefits)\n\n' +
    '📋 ELIGIBLE COSTS DETAIL\n' +
    '• Property Purchase: ' + formatCurrency(calculationResults.propertyPurchase) + '\n' +
    '• Renovations: ' + formatCurrency(calculationResults.restructuring) + '\n' +
    '• Fixtures & Fittings: ' + formatCurrency(calculationResults.fixtures) + '\n' +
    '• Innovation: ' + formatCurrency(calculationResults.innovation) + '\n' +
    '• Environmental: ' + formatCurrency(calculationResults.environmental) + '\n' +
    '• Design & PM: ' + formatCurrency(calculationResults.designPm) + '\n' +
    '• Studies: ' + formatCurrency(calculationResults.preliminaryStudies) + '\n\n' +
    '❌ NON-ELIGIBLE COSTS\n' +
    '• Agency Fees: ' + formatCurrency(calculationResults.agencyFees) + '\n' +
    '• Registration Tax: ' + formatCurrency(calculationResults.registrationTax) + '\n' +
    '• Notary & Legal: ' + formatCurrency(calculationResults.notaryFees) + '\n' +
    '• Consulting: ' + formatCurrency(calculationResults.consultingFees) + '\n\n' +
    '📈 KEY METRICS\n' +
    '• Grant Rate: ' + calculationResults.grantRate + '% of eligible costs\n' +
    '• Tax Credit: 15% of eligible costs\n' +
    '• Integrated Components: ' + calculationResults.integratedPercent.toFixed(1) + '%\n' +
    '• Professional Costs: ' + formatCurrency(calculationResults.professionalCosts || 0) + '\n\n' +
    '📞 NEXT STEPS:\n' +
    'Contact M&T International\n' +
    '📧 info@marietrulli.com\n' +
    '📱 +39 351 400 1402\n\n' +
    'Generated by InvestiScope™ Classic';
  
  window.open('https://wa.me/393514001402?text=' + encodeURIComponent(message), '_blank');
  
  closeModal();
  showSuccessToast();
}

// Show success toast
function showSuccessToast() {
  const toast = document.getElementById('successToast');
  toast.style.display = 'block';
  toast.style.animation = 'slideInRight 0.3s ease-out';
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
  }, 3000);
}

// Initialize on page load
updateCalculations();