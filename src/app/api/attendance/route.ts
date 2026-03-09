import { NextResponse } from "next/server";
import {
    findAttendanceRecord,
    createAttendanceRecord,
    updateAttendanceRecord,
    getAttendanceFromAirtable,
    ServiceFields
} from "@/lib/airtable";

async function upsertServiceAttendance(date: string, serviceType: string, counts: { adults: number; kids: number; babies: number }) {
    const existing = await findAttendanceRecord(date, serviceType);
    const submittedAt = new Date().toISOString();

    if (existing) {
        // Prepare updated history
        let history = [];
        try {
            history = existing.fields.History ? JSON.parse(existing.fields.History) : [];
        } catch (e) {
            console.error("Failed to parse history JSON", e);
        }

        // Add current record state to history before overwriting
        history.push({
            adults: existing.fields.Adults,
            kids: existing.fields.Kids,
            babies: existing.fields.Babies,
            submittedAt: existing.fields.Date
        });

        // Keep last 20 versions
        const historyLimit = 20;
        const newHistory = history.slice(-historyLimit);

        return await updateAttendanceRecord(existing.id, {
            Adults: counts.adults,
            Kids: counts.kids,
            Babies: counts.babies,
            // REMOVED: Date: submittedAt, 
            // Keep original date so it doesn't "move" to today if re-submitted later
            History: JSON.stringify(newHistory)
        });
    } else {
        // Create new record
        return await createAttendanceRecord({
            Date: submittedAt,
            ServiceType: serviceType,
            Adults: counts.adults,
            Kids: counts.kids,
            Babies: counts.babies,
            History: "[]"
        });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { date, mainService, kidsService } = body;

        if (!date || !mainService || !kidsService) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Upsert both services
        await upsertServiceAttendance(date, "Main Service", mainService);
        await upsertServiceAttendance(date, "Kids Service", kidsService);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("API POST /attendance error:", error);
        return NextResponse.json({ error: error.message || "Failed to submit attendance" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { recordId, versionId, adults, kids, babies } = body;

        if (!recordId) {
            return NextResponse.json({ error: "Missing required recordId" }, { status: 400 });
        }

        // Fetch all records to find the master and its history
        const allRecords = await getAttendanceFromAirtable(200);
        const existing = allRecords.records?.find((r: any) => r.id === recordId);

        if (!existing) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }

        let history: any[] = [];
        try {
            history = existing.fields.History ? JSON.parse(existing.fields.History) : [];
        } catch (e) {
            console.error("Failed to parse history", e);
        }

        // Case 1: Restore a specific version
        if (versionId !== undefined && versionId !== null) {
            const restoreIndex = history.findIndex((v: any) => v.submittedAt === versionId);
            if (restoreIndex === -1) {
                return NextResponse.json({ error: "Version not found in history" }, { status: 404 });
            }

            const restoreData = history[restoreIndex];
            const newHistory = [...history];
            newHistory[restoreIndex] = {
                adults: existing.fields.Adults ?? 0,
                kids: existing.fields.Kids ?? 0,
                babies: existing.fields.Babies ?? 0,
                submittedAt: existing.fields.Date ?? new Date().toISOString()
            };

            await updateAttendanceRecord(recordId, {
                Adults: restoreData.adults,
                Kids: restoreData.kids,
                Babies: restoreData.babies,
                // REMOVED: Date: restoreData.submittedAt, 
                // We keep the master date so it stays in the correct chronological slot
                History: JSON.stringify(newHistory)
            });

            return NextResponse.json({ success: true, message: "Version restored" }, { status: 200 });
        }

        // Case 2: Direct value update (Add to history first)
        if (adults !== undefined || kids !== undefined || babies !== undefined) {
            const newHistory = [...history];

            // Add current state to history before overwriting
            newHistory.push({
                adults: existing.fields.Adults ?? 0,
                kids: existing.fields.Kids ?? 0,
                babies: existing.fields.Babies ?? 0,
                submittedAt: existing.fields.Date ?? new Date().toISOString()
            });

            const historyLimit = 20;
            const limitedHistory = newHistory.slice(-historyLimit);

            await updateAttendanceRecord(recordId, {
                Adults: adults !== undefined ? adults : (existing.fields.Adults ?? 0),
                Kids: kids !== undefined ? kids : (existing.fields.Kids ?? 0),
                Babies: babies !== undefined ? babies : (existing.fields.Babies ?? 0),
                // REMOVED: Date: new Date().toISOString(), 
                // Do not change the event date when editing values
                History: JSON.stringify(limitedHistory)
            });

            return NextResponse.json({ success: true, message: "Values updated" }, { status: 200 });
        }

        return NextResponse.json({ error: "Invalid update parameters" }, { status: 400 });
    } catch (error: any) {
        console.error("API PATCH /attendance error:", error);
        return NextResponse.json({ error: error.message || "Failed to update record" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limitStr = searchParams.get("limit");
        const limit = limitStr ? parseInt(limitStr, 10) : 100;

        const result = await getAttendanceFromAirtable(limit);
        return NextResponse.json({ success: true, data: result }, { status: 200 });
    } catch (error: any) {
        console.error("API GET /attendance error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch attendance" }, { status: 500 });
    }
}
