async function inspectUnstop() {
  try {
    const res = await fetch('https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page=5', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    const json = await res.json();
    console.log('Unstop Keys:', Object.keys(json));
    const items = json?.data?.data || json?.data || [];
    console.log(`Found ${items.length} items`);
    if (items.length > 0) {
      const first = items[0];
      console.log('Sample item:', {
        id: first.id,
        title: first.title,
        organisation: first.organisation?.name || first.organisation_name,
        type: first.opportunity_type,
        region: first.region,
        deadline: first.regn_requirements?.end_regn_dt || first.end_date,
        url: `https://unstop.com/${first.public_url}`,
      });
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

inspectUnstop();
