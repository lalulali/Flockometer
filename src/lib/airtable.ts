export interface ServiceFields {
    Date: string;
    ServiceType: string;
    Adults: number;
    Kids: number;
    Babies: number;
    History?: string; // JSON string for versioning
}

async function getAirtableConfig() {
    const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

    if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
        throw new Error('Airtable credentials are not properly configured.');
    }

    return {
        pat: AIRTABLE_PAT,
        base: AIRTABLE_BASE_ID,
        table: AIRTABLE_TABLE_NAME,
        url: `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`
    };
}

export async function createAttendanceRecord(fields: ServiceFields) {
    const config = await getAirtableConfig();
    const response = await fetch(config.url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.pat}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: [{ fields }] }),
        cache: 'no-store'
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Airtable Create Error: ${JSON.stringify(errorData)}`);
    }

    return response.json();
}

export async function updateAttendanceRecord(recordId: string, fields: Partial<ServiceFields>) {
    const config = await getAirtableConfig();
    const response = await fetch(`${config.url}/${recordId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${config.pat}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
        cache: 'no-store'
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Airtable Update Error: ${JSON.stringify(errorData)}`);
    }

    return response.json();
}

export async function findAttendanceRecord(date: string, serviceType: string) {
    const config = await getAirtableConfig();
    const formula = `AND(IS_SAME({Date}, '${date}', 'day'), {ServiceType} = '${serviceType}')`;
    const url = `${config.url}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${config.pat}`,
            'Content-Type': 'application/json',
        },
        cache: 'no-store'
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Airtable Find Error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.records && data.records.length > 0 ? data.records[0] : null;
}

export async function getAttendanceFromAirtable(maxRecords: number = 100) {
    const config = await getAirtableConfig();
    // Sort by Date descending to get recent first
    const sortParam = `sort%5B0%5D%5Bfield%5D=Date&sort%5B0%5D%5Bdirection%5D=desc`;
    const url = `${config.url}?maxRecords=${maxRecords}&${sortParam}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${config.pat}`,
            'Content-Type': 'application/json',
        },
        cache: 'no-store'
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Airtable Fetch Error: ${JSON.stringify(errorData)}`);
    }

    return response.json();
}
