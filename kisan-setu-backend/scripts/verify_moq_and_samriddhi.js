import { getMarketIntelligence } from '../src/services/market.service.js';
import { getDriverFleet, optimizeRoute, findDriver, recommendDriverForPayload } from '../src/services/logistics.service.js';
import { ROLE_MOQ_KG, getQuantityInKg } from '../src/services/order.service.js';

async function verify() {
  console.log('--- 1. VERIFY ROLE-BASED MOQ ---');
  console.log('Role MOQ Config:', ROLE_MOQ_KG);
  if (ROLE_MOQ_KG['local-consumer'] !== 25) {
    throw new Error('Local Consumer MOQ is not 25 kg!');
  }
  console.log('✓ Local Consumer MOQ is strictly set to 25 kg');

  // Verify unit conversions
  const qQuintal = getQuantityInKg(0.25, 'QUINTAL');
  if (qQuintal !== 25) throw new Error('0.25 Quintal should equal 25 kg, got: ' + qQuintal);
  console.log('✓ 0.25 Quintal correctly converts to 25 kg');

  const qKg = getQuantityInKg(25, 'KG');
  if (qKg !== 25) throw new Error('25 KG should equal 25 kg, got: ' + qKg);
  console.log('✓ 25 KG correctly converts to 25 kg');

  console.log('\n--- 2. VERIFY MARKET INTELLIGENCE & DEMAND FORECASTING ---');
  const intel = await getMarketIntelligence({ cropName: 'potato', location: 'Sitamarhi' });
  console.log(`Crop: ${intel.crop}, Recommended Rate: ₹${intel.pricing.recommendedFairPricePerKg}/kg (₹${intel.pricing.recommendedFairPricePerQuintal}/Q)`);
  console.log(`Official MSP: ₹${intel.pricing.officialMspPerKg}/kg (Status: ${intel.pricing.status})`);
  console.log('Demand Breakdown by Persona:');
  intel.buyerPersonaBreakdown.forEach(b => {
    console.log(` - ${b.label}: Avg ${b.averageOrderQtyKg} kg/order | Projected: ${b.projectedDemandKg} kg (${b.sharePercent}%) | MOQ: ${b.moqKg} kg`);
  });
  if (intel.buyerPersonaBreakdown.length !== 5) throw new Error('Expected 5 buyer personas');
  console.log('✓ Market intelligence successfully computed demand and fair pricing');

  console.log('\n--- 3. VERIFY THE 5 REGISTERED DRIVERS FLEET ---');
  const fleet = await getDriverFleet();
  console.log(`Registered Block Drivers: ${fleet.length} drivers found`);
  if (fleet.length !== 5) throw new Error(`Expected exactly 5 drivers, found: ${fleet.length}`);

  const expectedDrivers = [
    { id: 'SN 365', name: 'Soham Nayek', capacity: 1000 },
    { id: 'HS 265', name: 'Harsh Sahu', capacity: 1500 },
    { id: 'AV 60', name: 'Ayush Vardhan', capacity: 450 },
    { id: 'PB 25', name: 'Piyush Bhagat', capacity: 1250 },
    { id: 'AK 47', name: 'Abhijeet Kumar', capacity: 4000 }
  ];

  expectedDrivers.forEach(expected => {
    const found = fleet.find(d => d.id === expected.id && d.name.toLowerCase().includes(expected.name.toLowerCase().slice(0, 5)));
    if (!found) throw new Error(`Missing expected driver: ${expected.name} (ID: ${expected.id})`);
    console.log(`✓ Driver verified: [${found.id}] ${found.name} - ${found.vehicleType} (${found.capacityKg} kg)`);
  });

  // Test flexible alias matching
  console.log('\n--- 4. VERIFY DRIVER ALIAS LOOKUP (findDriver) ---');
  const tests = [
    { query: 'AV60', expectedId: 'AV 60' },
    { query: 'pb 25', expectedId: 'PB 25' },
    { query: 'Ak 47', expectedId: 'AK 47' },
    { query: 'SN 365', expectedId: 'SN 365' },
    { query: 'HS265', expectedId: 'HS 265' },
    { query: 'ayush avrdhan', expectedId: 'AV 60' },
    { query: 'piyus bhagat', expectedId: 'PB 25' }
  ];

  tests.forEach(t => {
    const matched = findDriver(t.query);
    if (!matched || matched.id !== t.expectedId) {
      throw new Error(`Failed to match query "${t.query}". Expected ID: ${t.expectedId}, got: ${matched?.id}`);
    }
    console.log(`✓ Query "${t.query}" correctly matched -> [${matched.id}] ${matched.name}`);
  });

  // Test Ask Samriddhi optimal payload recommendation
  console.log('\n--- 5. VERIFY ASK SAMRIDDHI DRIVER RECOMMENDATION ---');
  const payloadTests = [
    { weightKg: 200, expectedDriverId: 'AV 60', note: 'Local Consumer micro-batch (200kg) -> Piaggio Ape Electric' },
    { weightKg: 850, expectedDriverId: 'SN 365', note: 'Standard farm harvest (850kg) -> Tata Ace' },
    { weightKg: 1100, expectedDriverId: 'PB 25', note: 'Medium bulk harvest (1100kg) -> Ashok Leyland Dost+' },
    { weightKg: 1400, expectedDriverId: 'HS 265', note: 'Heavy rural harvest (1400kg) -> Mahindra Bolero Maxi' },
    { weightKg: 3500, expectedDriverId: 'AK 47', note: 'Commercial bulk consignment (3500kg) -> Eicher Pro 4-Tonne' }
  ];

  payloadTests.forEach(pt => {
    const rec = recommendDriverForPayload(pt.weightKg);
    if (!rec || rec.driver.id !== pt.expectedDriverId) {
      throw new Error(`Payload test failed for ${pt.weightKg} kg. Expected ${pt.expectedDriverId}, got ${rec?.driver?.id}`);
    }
    console.log(`✓ ${pt.weightKg} kg -> [${rec.driver.id}] ${rec.driver.name} (${pt.note})`);
  });

  console.log('\n--- 6. VERIFY ROUTE OPTIMIZATION ROADMAP ---');
  const route = await optimizeRoute({ prakhand: 'Dumra', driverId: 'SN 365' });
  console.log(`Assigned Driver: ${route.driver.name} [${route.driver.id}] (${route.driver.vehicleType})`);
  console.log(`Cargo: ${route.cargoSummary.totalWeightKg} kg (${route.driver.loadUtilizationPercent}% load)`);
  console.log(`Optimized Distance: ${route.efficiencyMetrics.optimizedDistanceKm} km (Saved: ${route.efficiencyMetrics.distanceSavedKm} km)`);
  console.log(`Fuel Cost Saved: ₹${route.efficiencyMetrics.fuelCostSavedInr}`);
  console.log('Sequential Roadmap:');
  route.itineraryRoadmap.forEach(s => {
    console.log(`  [Stop ${s.stopNumber}] ${s.time} | ${s.type} | ${s.location} | ${s.cargoAction}`);
  });
  if (route.itineraryRoadmap.length < 3) throw new Error('Expected at least 3 stops in itinerary');
  console.log('✓ Route roadmap successfully generated and optimized');

  console.log('\n--- 7. VERIFY STATUTORY MSP (₹12/KG) & BELOW-MSP ADMIN ALERTS ---');
  const { STATUTORY_MSP_PER_KG, STATUTORY_MSP_PER_QUINTAL, checkCompliance, enforceListingCompliance } = await import('../src/services/msp.service.js');
  console.log(`Statutory Fixed MSP: ₹${STATUTORY_MSP_PER_KG}/kg (₹${STATUTORY_MSP_PER_QUINTAL}/Quintal)`);
  if (STATUTORY_MSP_PER_KG !== 12) throw new Error('Statutory MSP is not set to 12 rs/kg!');
  if (STATUTORY_MSP_PER_QUINTAL !== 1200) throw new Error('Statutory MSP is not set to 1200 rs/Quintal!');
  console.log('✓ Statutory MSP is strictly fixed at ₹12/kg (₹1,200/Quintal) for each produce');

  // Test Compliance Checks: Above vs Below MSP
  const checkBelowKg = await checkCompliance({ cropName: 'Potato', price: 9.5, unit: 'KG' });
  if (checkBelowKg.compliant) throw new Error('₹9.5/kg should be below MSP!');
  if (checkBelowKg.deficitPerKg !== 2.5) throw new Error(`Expected deficit 2.5, got: ${checkBelowKg.deficitPerKg}`);
  console.log(`✓ ₹9.50/kg correctly flagged as Below-MSP violation (Deficit: ₹${checkBelowKg.deficitPerKg}/kg, ${checkBelowKg.deficitPercent}%)`);

  const checkBelowQuintal = await checkCompliance({ cropName: 'Wheat', price: 900, unit: 'QUINTAL' });
  if (checkBelowQuintal.compliant) throw new Error('₹900/Quintal should be below MSP!');
  if (checkBelowQuintal.deficitPerKg !== 3) throw new Error(`Expected deficit 3, got: ${checkBelowQuintal.deficitPerKg}`);
  console.log(`✓ ₹900/Quintal (₹9/kg) correctly flagged as Below-MSP violation (Deficit: ₹${checkBelowQuintal.deficitPerKg}/kg)`);

  const checkAboveKg = await checkCompliance({ cropName: 'Tomato', price: 15, unit: 'KG' });
  if (!checkAboveKg.compliant) throw new Error('₹15/kg should be compliant with MSP!');
  console.log(`✓ ₹15.00/kg correctly approved as compliant (Above ₹12/kg MSP)`);

  // Test Admin Alert generation on Below-MSP listing
  const alertTest = await enforceListingCompliance({
    cropName: 'Tomato Hybrid',
    title: 'Fresh Red Tomatoes',
    price: 8.5,
    unit: 'KG',
    farmerName: 'Rameshwar Yadav',
    farmerPhone: '+91 98321 44556',
    location: 'Dumra Village, Sitamarhi'
  });

  if (!alertTest.violation) throw new Error('enforceListingCompliance should flag violation for ₹8.5/kg');
  if (!alertTest.alertTitle.includes('Critical Below-MSP Alert')) throw new Error('Missing alert title for below MSP');
  if (!alertTest.alertMessage.includes('Rameshwar Yadav')) throw new Error('Missing farmer name in alert message');
  if (!alertTest.alertMessage.includes('12.00/kg')) throw new Error('Missing statutory MSP in alert message');
  console.log('✓ Below-MSP listing generated Critical Admin Alert:');
  console.log(`   Title: ${alertTest.alertTitle}`);
  console.log(`   Message: ${alertTest.alertMessage}`);
  console.log(`   Farmer Details Transmitted: ${JSON.stringify(alertTest.farmerDetails)}`);

  console.log('\n🎉 ALL 7 VERIFICATION TEST SUITES PASSED SUCCESSFULLY!');
}

verify().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

