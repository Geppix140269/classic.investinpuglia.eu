// Local version of script.js without Firebase authentication
// Configuration
const SUPABASE_URL = 'https://kjyobkrjcmiuusijvrme.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeW9ia3JqY21pdXVzaWp2cm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NDM5NzMsImV4cCI6MjA2NjUxOTk3M30.2GxAUtXPal7ufxg7KgWMO7h15RXJOolBWt0-NPygj2I';
const EMAILJS_SERVICE_ID = 'service_w6tghqr';
const EMAILJS_TEMPLATE_ID = 'template_vztws4q';
const EMAILJS_PUBLIC_KEY = 'wKn1_xMCtZssdZzpb';

// Initialize services
let supabase;
let calculationResults = {};
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

// Initialize on page load (without Firebase)
window.addEventListener('load', async function() {
  console.log('Local version - initializing calculator without authentication');
  initializeCalculator();
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
const DESIGN_PM_RATE = 0.06;
const PRELIMINARY_STUDIES_RATE = 0.015;
const MIN_INTEGRATED_PERCENT = 0.05;
const REGISTRATION_TAX_RATE = 0.09;

// Get user data
const userData = JSON.parse(localStorage.getItem('investiscope_user_data') || '{}');

// Input elements
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

// Display elements
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
  agencyRate: document.getElementById('agencyRateDisplay'),
  registrationTax: document.getElementById('registrationTaxValue'),
  notaryFees: document.getElementById('notaryFeesValue'),
  consultingFees: document.getElementById('consultingFeesValue'),
  totalNonEligible: document.getElementById('totalNonEligibleDisplay'),
  totalProject: document.getElementById('totalProjectDisplay'),
  netInvestment: document.getElementById('netInvestmentDisplay')
};

// Add event listeners
Object.values(inputs).forEach(input => {
  if (input) {
    input.addEventListener('input', updateCalculations);
  }
});

// Professional costs checkboxes
document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', updateCalculations);
});

// Update slider ranges with dynamic config
function updateSliderRanges() {
  if (dynamicConfig) {
    // Property Purchase
    if (inputs.propertyPurchase) {
      inputs.propertyPurchase.min = getConfigValue('parameters.propertyValue.min', 100000);
      inputs.propertyPurchase.max = getConfigValue('parameters.propertyValue.max', 3000000);
      inputs.propertyPurchase.step = getConfigValue('parameters.propertyValue.step', 10000);
    }
    
    // Restructuring
    if (inputs.restructuring) {
      inputs.restructuring.min = getConfigValue('parameters.renovationBudget.min', 50000);
      inputs.restructuring.max = getConfigValue('parameters.renovationBudget.max', 2000000);
      inputs.restructuring.step = getConfigValue('parameters.renovationBudget.step', 10000);
    }
  }
}

function formatCurrency(value) {
  return '€' + Math.round(value).toLocaleString('en-US');
}

function updateCalculations() {
  // Get input values
  const propertyPurchase = parseFloat(inputs.propertyPurchase.value);
  const restructuring = parseFloat(inputs.restructuring.value);
  const fixtures = parseFloat(inputs.fixtures.value);
  const innovation = parseFloat(inputs.innovation.value);
  const environmental = parseFloat(inputs.environmental.value);
  const grantRate = parseFloat(inputs.grantRate.value) / 100;
  const agencyRate = parseFloat(inputs.agencyFees.value) / 100;
  
  // Update display values
  displays.propertyPurchase.textContent = formatCurrency(propertyPurchase);
  displays.restructuring.textContent = formatCurrency(restructuring);
  displays.fixtures.textContent = formatCurrency(fixtures);
  displays.innovation.textContent = formatCurrency(innovation);
  displays.environmental.textContent = formatCurrency(environmental);
  displays.grantRate.textContent = Math.round(grantRate * 100) + '%';
  
  // Calculate civil works
  const civilWorks = propertyPurchase + restructuring;
  
  // Calculate Design & PM (use dynamic rate)
  const designPmRate = getConfigValue('parameters.costs.designAndPM.percent', 6) / 100;
  const designPm = restructuring * designPmRate;
  displays.designPm.textContent = formatCurrency(designPm);
  
  // Update design PM note
  document.getElementById('designPmNote').textContent = 
    (designPmRate * 100) + '% × ' + formatCurrency(restructuring) + ' (renovations) = ' + formatCurrency(designPm);
  
  // Calculate integrated components
  const integratedTotal = innovation + environmental;
  displays.integratedTotal.textContent = formatCurrency(integratedTotal);
  
  // Calculate preliminary total (before preliminary studies)
  const preliminaryTotal = propertyPurchase + restructuring + fixtures + 
                         innovation + environmental + designPm;
  
  // Calculate preliminary studies (use dynamic rate)
  const preliminaryRate = getConfigValue('parameters.costs.preliminaryStudies.percent', 1.5) / 100;
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
    displays.integratedStatus.innerHTML = '✓ Meets minimum ' + minIntegrated + '% requirement';
    displays.integratedStatus.style.color = '#059669';
  } else {
    displays.integratedStatus.innerHTML = '✗ Below minimum ' + minIntegrated + '% requirement';
    displays.integratedStatus.style.color = '#dc2626';
  }
  
  // Calculate grant and tax credit
  const miniPiaGrant = totalEligible * grantRate;
  const taxCredit = totalEligible * 0.15; // 15% tax credit
  const totalBenefit = miniPiaGrant + taxCredit;
  
  // Update displays with proper rounding
  displays.miniPiaGrant.textContent = formatCurrency(miniPiaGrant);
  displays.taxCredit.textContent = formatCurrency(taxCredit);
  displays.totalBenefit.textContent = formatCurrency(totalBenefit);
  
  // Calculate non-eligible costs
  const agencyFees = propertyPurchase * agencyRate;
  const registrationTax = propertyPurchase * REGISTRATION_TAX_RATE;
  const notaryFeesBase = parseFloat(inputs.notaryFees.value);
  const consultingFees = parseFloat(inputs.consultingFees.value);
  
  displays.agencyFees.textContent = formatCurrency(agencyFees);
  displays.agencyRate.textContent = (agencyRate * 100).toFixed(1) + '%';
  displays.registrationTax.textContent = formatCurrency(registrationTax);
  displays.notaryFees.textContent = formatCurrency(notaryFeesBase);
  displays.consultingFees.textContent = formatCurrency(consultingFees);
  
  const totalNonEligible = agencyFees + registrationTax + notaryFeesBase + consultingFees;
  displays.totalNonEligible.textContent = formatCurrency(totalNonEligible);
  
  // Calculate professional costs
  calculateProfessionalCosts(propertyPurchase, restructuring);
  
  // Calculate total project and net investment
  const totalProject = totalEligible + totalNonEligible;
  const netInvestment = totalProject - totalBenefit;
  
  displays.totalProject.textContent = formatCurrency(totalProject);
  displays.netInvestment.textContent = formatCurrency(netInvestment);
  
  // Update suggested percentages dynamically
  const suggestedFixtures = civilWorks * 0.125;
  document.getElementById('fixturesSuggestion').textContent = 
    'Suggested: 12.5% of civil works (' + formatCurrency(suggestedFixtures) + ')';
  
  const suggestedInnovation = civilWorks * 0.035;
  document.getElementById('innovationSuggestion').textContent = 
    'Suggested: 3-4% of civil works (' + formatCurrency(suggestedInnovation) + ')';
  
  const suggestedEnvironmental = civilWorks * 0.025;
  document.getElementById('environmentalSuggestion').textContent = 
    'Suggested: 2-3% of civil works (' + formatCurrency(suggestedEnvironmental) + ')';
  
  // Store results for form submission
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
    totalNonEligible,
    totalProject,
    netInvestment,
    integratedPercent,
    agencyFees,
    registrationTax,
    notaryFees: notaryFeesBase,
    consultingFees
  };
  
  // Update preview values if modal is open
  if (document.getElementById('registrationOverlay').style.display === 'block') {
    updatePreviewValues();
  }
}

function calculateProfessionalCosts(propertyPrice, renovationBudget) {
  let total = 0;
  
  // Notary fees
  if (document.getElementById('cost-notaryFees').checked) {
    const cost = Math.min(Math.max(propertyPrice * 0.02, 1500), 15000);
    document.getElementById('value-notaryFees').textContent = formatCurrency(cost);
    total += cost;
  } else {
    document.getElementById('value-notaryFees').textContent = '€0';
  }
  
  // Legal fees
  if (document.getElementById('cost-legalFees').checked) {
    const cost = Math.min(Math.max(propertyPrice * 0.015, 2000), 10000);
    document.getElementById('value-legalFees').textContent = formatCurrency(cost);
    total += cost;
  } else {
    document.getElementById('value-legalFees').textContent = '€0';
  }
  
  // Architect fees
  if (document.getElementById('cost-architectFees').checked) {
    const cost = Math.max(renovationBudget * 0.08, 5000);
    document.getElementById('value-architectFees').textContent = formatCurrency(cost);
    total += cost;
  } else {
    document.getElementById('value-architectFees').textContent = '€0';
  }
  
  // Permits
  if (document.getElementById('cost-permitCosts').checked) {
    const cost = 5000;
    document.getElementById('value-permitCosts').textContent = formatCurrency(cost);
    total += cost;
  } else {
    document.getElementById('value-permitCosts').textContent = '€0';
  }
  
  // Project management
  if (document.getElementById('cost-projectManagement').checked) {
    const cost = Math.max(renovationBudget * 0.05, 5000);
    document.getElementById('value-projectManagement').textContent = formatCurrency(cost);
    total += cost;
  } else {
    document.getElementById('value-projectManagement').textContent = '€0';
  }
  
  document.getElementById('total-professional-costs').textContent = formatCurrency(total);
  calculationResults.professionalCosts = total;
}

// Show registration modal
window.showRegistrationModal = function() {
  document.getElementById('registrationOverlay').style.display = 'block';
  document.body.style.overflow = 'hidden';
  updatePreviewValues();
}

// Close modal
window.closeModal = function() {
  document.getElementById('registrationOverlay').style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Update preview values
function updatePreviewValues() {
  if (calculationResults.miniPiaGrant) {
    document.getElementById('previewGrant').textContent = formatCurrency(calculationResults.miniPiaGrant);
    document.getElementById('previewBenefit').textContent = formatCurrency(calculationResults.totalBenefit);
    document.getElementById('previewNet').textContent = formatCurrency(calculationResults.netInvestment);
    document.getElementById('previewTotal').textContent = formatCurrency(calculationResults.totalProject);
  }
}

// Generate PDF Report
function generatePDFReport(data) {
  // Check if jsPDF is loaded
  if (!window.jspdf || !window.jspdf.jsPDF) {
    console.error('jsPDF library not loaded');
    throw new Error('PDF library not available');
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Colors
  const primaryGreen = [16, 185, 129];
  const darkBlue = [30, 41, 59];
  const lightGray = [243, 244, 246];
  const white = [255, 255, 255];
  
  let yPos = 20;
  
  // Page 1 - Cover Page
  // Background
  doc.setFillColor(...darkBlue);
  doc.rect(0, 0, 210, 297, 'F');
  
  // Logo area
  doc.setFillColor(...primaryGreen);
  doc.rect(0, 40, 210, 80, 'F');
  
  // Title
  doc.setTextColor(...white);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('InvestiScope™', 105, 70, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional Investment Analysis Report', 105, 85, { align: 'center' });
  doc.text('Mini PIA Turismo Grant Calculator', 105, 95, { align: 'center' });
  
  // Client Info Box
  doc.setFillColor(...white);
  doc.roundedRect(30, 140, 150, 60, 5, 5, 'F');
  
  doc.setTextColor(...darkBlue);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Prepared for:', 40, 155);
  
  doc.setFontSize(16);
  doc.text(data.name || 'Valued Investor', 40, 165);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(data.email || '', 40, 173);
  if (data.location) {
    doc.text('Property Location: ' + data.location, 40, 181);
  }
  doc.text('Report Date: ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 40, 189);
  
  // Key Highlights Box
  doc.setFillColor(...primaryGreen);
  doc.rect(0, 220, 210, 60, 'F');
  
  doc.setTextColor(...white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Your Investment Opportunity', 105, 240, { align: 'center' });
  
  doc.setFontSize(28);
  doc.text('€' + Math.round(data.miniPiaGrant).toLocaleString(), 105, 255, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('in Mini PIA Turismo Grants Available', 105, 265, { align: 'center' });
  
  // Add more pages with details...
  
  return doc;
}

// Handle registration
window.handleRegistration = async function(event) {
  event.preventDefault();
  
  const name = document.getElementById('userName').value;
  const email = document.getElementById('userEmail').value;
  const phone = document.getElementById('userPhone').value;
  const location = document.getElementById('propertyLocation').value;
  const timeline = document.getElementById('investmentTimeline').value;
  
  try {
    // Skip database save for local version
    console.log('Generating PDF report...');
    
    // Check if jsPDF is available
    if (!window.jspdf || !window.jspdf.jsPDF) {
      console.error('jsPDF not loaded. Waiting for library...');
      // Try to load it dynamically
      await new Promise((resolve) => {
        const checkJsPDF = setInterval(() => {
          if (window.jspdf && window.jspdf.jsPDF) {
            clearInterval(checkJsPDF);
            resolve();
          }
        }, 100);
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkJsPDF);
          resolve();
        }, 5000);
      });
    }
    
    // Generate PDF
    const pdf = generatePDFReport({
      name: name,
      email: email,
      location: location,
      totalProject: calculationResults.totalProject,
      miniPiaGrant: calculationResults.miniPiaGrant,
      taxCredit: calculationResults.taxCredit,
      netInvestment: calculationResults.netInvestment,
      propertyPurchase: calculationResults.propertyPurchase,
      restructuring: calculationResults.restructuring,
      fixtures: calculationResults.fixtures,
      innovation: calculationResults.innovation,
      environmental: calculationResults.environmental,
      designPm: calculationResults.designPm,
      preliminaryStudies: calculationResults.preliminaryStudies,
      totalEligible: calculationResults.totalEligible,
      agencyFees: calculationResults.agencyFees,
      registrationTax: calculationResults.registrationTax,
      notaryFees: calculationResults.notaryFees,
      consultingFees: calculationResults.consultingFees,
      totalNonEligible: calculationResults.totalNonEligible,
      integratedPercent: calculationResults.integratedPercent,
      professionalCosts: calculationResults.professionalCosts || 0
    });

    // Download the PDF
    pdf.save('InvestiScope_Report_' + name.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.pdf');

    // Close modal and show success
    closeModal();
    document.getElementById('reportForm').reset();
    showSuccessToast();
    
  } catch (error) {
    console.error('Error:', error);
    if (error.message && error.message.includes('PDF')) {
      alert('The PDF generator is still loading. Please try again in a few seconds.');
    } else {
      alert('There was an error generating your PDF report. Please check the console for details and try again.');
    }
  }
  
  return false;
}

// Send WhatsApp report
window.sendWhatsAppDirect = function() {
  if (!calculationResults.totalProject) {
    alert('Please wait for calculations to complete');
    return;
  }
  
  const message = '🏠 INVESTISCOPE™ CLASSIC REPORT\n\n' +
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
    '• Grant Rate: 45% of eligible costs\n' +
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
  setTimeout(() => {
    toast.style.display = 'none';
  }, 5000);
}

// Close modal when clicking outside
document.getElementById('registrationOverlay').addEventListener('click', function(e) {
  if (e.target === this) {
    closeModal();
  }
});

// Prevent modal content from closing modal
document.querySelector('.modal-content').addEventListener('click', function(e) {
  e.stopPropagation();
});