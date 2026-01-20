# 🚀 Supabase Easy Setup Guide for Beginners

Follow these simple steps to connect your school portal to a real database.

---

## 1. Create Your Project
1. Go to [supabase.com](https://supabase.com/) and sign in.
2. Click **"New Project"**.
3. Name it **"Imam Malik College"**.
4. Create a strong **Database Password** (write it down!).
5. Choose the region closest to you (e.g., London or US East).
6. Click **"Create New Project"** and wait about 2 minutes.

---

## 2. Connect Your App
1. On your Supabase Dashboard, go to **Project Settings** (gear icon) -> **API**.
2. Copy the **Project URL** and the **anon public API Key**.
3. In your code, open `services/supabaseClient.ts` and replace the values:
   ```typescript
   const SUPABASE_URL = 'YOUR_COPIED_URL';
   const SUPABASE_ANON_KEY = 'YOUR_COPIED_ANON_KEY';
   ```

---

## 3. Create Database Tables (The Easy Way)
1. In Supabase, click on the **SQL Editor** (the `>_` icon on the left).
2. Click **"New Query"**.
3. Copy and paste the code below into the editor:

```sql
-- 1. Create Students Table
create table imst_students (
  id uuid default gen_random_uuid() primary key,
  fullName text not null,
  regNumber text unique not null,
  pin text not null,
  classLevel text,
  guardianPhone text,
  feesPaid boolean default false,
  photoUrl text,
  status text default 'Admitted'
);

-- 2. Create Results Table
create table imst_results (
  id uuid default gen_random_uuid() primary key,
  studentId uuid references imst_students(id),
  studentName text,
  regNumber text,
  classLevel text,
  term text,
  session text,
  results jsonb,
  totalScore numeric,
  average numeric,
  position text,
  classPopulation integer,
  dateGenerated timestamp with time zone default now()
);

-- 3. Create Applications Table
create table imst_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  fullName text,
  classApplied text,
  phone text,
  email text,
  payment_reference text,
  status text default 'Pending',
  photo_url text,
  created_at timestamp with time zone default now()
);

-- 4. Create Staff Table
create table imst_teachers (
  id uuid default gen_random_uuid() primary key,
  fullName text,
  email text unique,
  assignedClasses text[],
  subjects text[]
);
```
4. Click **"Run"**. You now have a working database!

---

## 4. Enable Authentication (For Staff & Applicants)
1. Go to **Authentication** -> **Providers**.
2. Ensure **Email** is turned **ON**.
3. Go to **Auth Settings** and turn **OFF** "Confirm Email" if you want users to log in immediately without checking their inbox (good for testing).

---

## 5. Security Note (RLS)
By default, Supabase protects your data. For a beginner, you can go to **Database** -> **Tables** and "Disable RLS" for each table while you are building. 
*Note: In a real production app, you should eventually write "Policies" to control who can see what.*

---

**That's it! Your portal is now powered by a professional cloud database.**