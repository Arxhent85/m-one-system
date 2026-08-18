import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Shared in-memory / server-side registry for cross-device photo & profile sync
let globalCustomerProfiles: Record<string, any> = {}

export async function GET() {
  try {
    const supabase = await createClient()

    // Try reading from Supabase if table exists
    const { data: dbProfiles, error } = await supabase
      .from('customer_profiles' as any)
      .select('*')
      .limit(1000)

    if (!error && dbProfiles && dbProfiles.length > 0) {
      dbProfiles.forEach((p: any) => {
        if (p.customer_number) {
          globalCustomerProfiles[p.customer_number] = {
            customer_number: p.customer_number,
            company_name: p.company_name,
            city: p.city,
            phone: p.phone,
            email: p.email,
            contact_person: p.contact_person,
            notes: p.notes,
            photos: p.photos || [],
            gps: p.gps || null,
            updated_at: p.updated_at,
          }
        }
      })
    }
  } catch (e) {
    // Fallback to server memory
  }

  return NextResponse.json({
    success: true,
    profiles: globalCustomerProfiles,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { profile } = body

    if (!profile || !profile.customer_number) {
      return NextResponse.json({ success: false, error: 'Kundennummer fehlt' }, { status: 400 })
    }

    const cNum = String(profile.customer_number)
    globalCustomerProfiles[cNum] = {
      ...profile,
      updated_at: new Date().toISOString(),
    }

    // Try saving to Supabase if table exists
    try {
      const supabase = await createClient()
      await supabase
        .from('customer_profiles' as any)
        .upsert({
          customer_number: cNum,
          company_name: profile.company_name,
          city: profile.city,
          phone: profile.phone,
          email: profile.email,
          contact_person: profile.contact_person,
          notes: profile.notes,
          photos: profile.photos || [],
          gps: profile.gps || null,
          updated_at: new Date().toISOString(),
        } as any)
    } catch (dbErr) {
      // Ignored if table not yet created in Supabase, in-memory sync works
    }

    return NextResponse.json({
      success: true,
      profile: globalCustomerProfiles[cNum],
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
