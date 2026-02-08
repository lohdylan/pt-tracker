import pool from "./db.js";

async function seed() {
  console.log("Seeding database...");

  // Clear existing data (reverse FK order)
  await pool.query("DELETE FROM messages");
  await pool.query("DELETE FROM progress_photos");
  await pool.query("DELETE FROM notification_preferences");
  await pool.query("DELETE FROM push_tokens");
  await pool.query("DELETE FROM workout_logs");
  await pool.query("DELETE FROM measurements");
  await pool.query("DELETE FROM sessions");
  await pool.query("DELETE FROM workout_templates");
  await pool.query("DELETE FROM exercises");
  await pool.query("DELETE FROM clients");

  // Reset sequences
  await pool.query("ALTER SEQUENCE clients_id_seq RESTART WITH 1");
  await pool.query("ALTER SEQUENCE sessions_id_seq RESTART WITH 1");
  await pool.query("ALTER SEQUENCE workout_templates_id_seq RESTART WITH 1");
  await pool.query("ALTER SEQUENCE workout_logs_id_seq RESTART WITH 1");
  await pool.query("ALTER SEQUENCE measurements_id_seq RESTART WITH 1");
  await pool.query("ALTER SEQUENCE exercises_id_seq RESTART WITH 1");

  // --- Clients (with access codes) ---
  const clients = await pool.query(
    `INSERT INTO clients (first_name, last_name, email, phone, goals, notes, access_code, created_at) VALUES
     ('Sarah', 'Johnson', 'sarah.j@email.com', '555-0101', 'Lose 15 lbs, improve cardio endurance', 'Prefers morning sessions', 'SAR101', NOW() - INTERVAL '45 days'),
     ('Marcus', 'Chen', 'marcus.c@email.com', '555-0102', 'Build muscle mass, increase bench press', 'Former college athlete', 'MAR102', NOW() - INTERVAL '30 days'),
     ('Emily', 'Rodriguez', 'emily.r@email.com', '555-0103', 'Postpartum fitness, core strength', 'Cleared by doctor for all exercises', 'EMI103', NOW() - INTERVAL '25 days'),
     ('James', 'Okafor', 'james.o@email.com', '555-0104', 'Marathon prep, injury prevention', 'Has old knee injury - avoid high impact', 'JAM104', NOW() - INTERVAL '20 days'),
     ('Ava', 'Patel', 'ava.p@email.com', '555-0105', 'General fitness, stress relief', 'Yoga background, new to weight training', 'AVA105', NOW() - INTERVAL '14 days'),
     ('Tom', 'Baker', 'tom.b@email.com', '555-0106', 'Rehab after shoulder surgery', NULL, 'TOM106', NOW() - INTERVAL '7 days'),
     ('Lisa', 'Nguyen', NULL, '555-0107', 'Weight loss and toning', 'Vegetarian - adjust nutrition tips', 'LIS107', NOW() - INTERVAL '3 days'),
     ('Derek', 'Miller', 'derek.m@email.com', NULL, NULL, 'Trial session only', 'DER108', NOW() - INTERVAL '2 days')
     RETURNING id`
  );
  const cids = clients.rows.map((r: { id: number }) => r.id);
  console.log(`  ${cids.length} clients created (with access codes)`);

  // Deactivate Derek (trial that didn't convert)
  await pool.query("UPDATE clients SET is_active = false WHERE id = $1", [cids[7]]);

  // --- Helper: date relative to today ---
  const today = new Date();
  const d = (daysOffset: number, hour: number) => {
    const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysOffset, hour, 0, 0);
    return dt.toISOString();
  };

  // Monday of this week
  const dow = today.getDay();
  const monOffset = dow === 0 ? -6 : 1 - dow;

  // --- Sessions (spread across last 3 weeks + this week + today) ---
  const sessionRows = [
    // Past completed sessions (last 2-3 weeks)
    [cids[0], d(monOffset - 14, 8), 60, "completed", "Great energy, hit all targets"],
    [cids[1], d(monOffset - 14, 10), 60, "completed", "Bench PR: 185 lbs"],
    [cids[2], d(monOffset - 13, 9), 45, "completed", "Focused on pelvic floor exercises"],
    [cids[3], d(monOffset - 13, 16), 60, "completed", "Easy 5K pace run + stretching"],
    [cids[0], d(monOffset - 12, 8), 60, "completed", null],
    [cids[4], d(monOffset - 12, 11), 45, "completed", "Intro to free weights"],
    [cids[1], d(monOffset - 11, 10), 60, "no_show", null],
    [cids[5], d(monOffset - 10, 14), 45, "completed", "Assessment session"],

    // Last week
    [cids[0], d(monOffset - 7, 8), 60, "completed", "Cardio intervals + upper body"],
    [cids[1], d(monOffset - 7, 10), 60, "completed", "Back & biceps day"],
    [cids[2], d(monOffset - 6, 9), 45, "completed", "Core circuit went well"],
    [cids[3], d(monOffset - 6, 16), 60, "cancelled", "Client sick"],
    [cids[4], d(monOffset - 5, 11), 45, "completed", "Squats and deadlifts intro"],
    [cids[0], d(monOffset - 5, 8), 60, "completed", null],
    [cids[5], d(monOffset - 4, 14), 45, "completed", "Shoulder rehab band work"],
    [cids[1], d(monOffset - 4, 10), 60, "completed", "Chest & triceps"],
    [cids[6], d(monOffset - 3, 17), 60, "completed", "Initial assessment"],

    // This week (past days already completed)
    [cids[0], d(monOffset, 8), 60, "completed", "HIIT + core"],
    [cids[1], d(monOffset, 10), 60, "completed", "Leg day - squats, lunges, leg press"],
    [cids[2], d(monOffset + 1, 9), 45, "completed", "Resistance bands full body"],
    [cids[4], d(monOffset + 1, 11), 45, "completed", "Progressed to 15lb dumbbells"],
    [cids[3], d(monOffset + 2, 16), 60, "completed", "Tempo run 8K"],
    [cids[5], d(monOffset + 2, 14), 45, "completed", "Good ROM improvement"],

    // Today's sessions
    [cids[0], d(0, 8), 60, "completed", "Morning cardio blast"],
    [cids[6], d(0, 10), 60, "scheduled", null],
    [cids[1], d(0, 13), 60, "scheduled", null],
    [cids[4], d(0, 15), 45, "scheduled", null],
    [cids[3], d(0, 17), 60, "scheduled", null],

    // Future sessions this week
    [cids[2], d(1, 9), 45, "scheduled", null],
    [cids[5], d(1, 14), 45, "scheduled", null],
    [cids[0], d(2, 8), 60, "scheduled", null],
    [cids[1], d(2, 10), 60, "scheduled", null],
  ];

  for (const [client_id, scheduled_at, duration_min, status, notes] of sessionRows) {
    await pool.query(
      `INSERT INTO sessions (client_id, scheduled_at, duration_min, status, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $2::timestamptz - INTERVAL '1 day', $2)`,
      [client_id, scheduled_at, duration_min, status, notes]
    );
  }
  console.log(`  ${sessionRows.length} sessions created`);

  // --- Workout Templates ---
  await pool.query(
    `INSERT INTO workout_templates (name, exercises) VALUES
     ('Upper Body Strength', $1),
     ('Lower Body Power', $2),
     ('Full Body HIIT', $3),
     ('Core & Mobility', $4)`,
    [
      JSON.stringify([
        { exercise_name: "Bench Press", sets: 4, reps: 8, weight: 135 },
        { exercise_name: "Overhead Press", sets: 3, reps: 10, weight: 65 },
        { exercise_name: "Barbell Row", sets: 4, reps: 8, weight: 115 },
        { exercise_name: "Dumbbell Curl", sets: 3, reps: 12, weight: 25 },
        { exercise_name: "Tricep Dips", sets: 3, reps: 12 },
      ]),
      JSON.stringify([
        { exercise_name: "Back Squat", sets: 4, reps: 6, weight: 185 },
        { exercise_name: "Romanian Deadlift", sets: 3, reps: 10, weight: 135 },
        { exercise_name: "Walking Lunges", sets: 3, reps: 12 },
        { exercise_name: "Leg Press", sets: 3, reps: 12, weight: 270 },
        { exercise_name: "Calf Raises", sets: 4, reps: 15, weight: 90 },
      ]),
      JSON.stringify([
        { exercise_name: "Burpees", sets: 4, reps: 10 },
        { exercise_name: "Kettlebell Swings", sets: 4, reps: 15, weight: 35 },
        { exercise_name: "Box Jumps", sets: 3, reps: 12 },
        { exercise_name: "Battle Ropes", sets: 3, reps: 30 },
        { exercise_name: "Mountain Climbers", sets: 3, reps: 20 },
      ]),
      JSON.stringify([
        { exercise_name: "Plank Hold", sets: 3, reps: 60 },
        { exercise_name: "Dead Bug", sets: 3, reps: 12 },
        { exercise_name: "Bird Dog", sets: 3, reps: 10 },
        { exercise_name: "Hip Flexor Stretch", sets: 2, reps: 30 },
        { exercise_name: "Foam Rolling", sets: 1, reps: 300 },
      ]),
    ]
  );
  console.log("  4 workout templates created");

  // --- Workout Logs (for a few completed sessions) ---
  const completedSessions = await pool.query(
    "SELECT id FROM sessions WHERE status = 'completed' ORDER BY scheduled_at DESC LIMIT 5"
  );
  const sids = completedSessions.rows.map((r: { id: number }) => r.id);

  if (sids.length >= 3) {
    const logs = [
      [sids[0], "Treadmill Intervals", 5, 3, null, 0],
      [sids[0], "Plank Hold", 3, 60, null, 1],
      [sids[0], "Jump Rope", 4, 100, null, 2],

      [sids[1], "Back Squat", 4, 6, 185, 0],
      [sids[1], "Romanian Deadlift", 3, 10, 135, 1],
      [sids[1], "Leg Press", 3, 12, 270, 2],
      [sids[1], "Calf Raises", 4, 15, 90, 3],

      [sids[2], "Bench Press", 4, 8, 175, 0],
      [sids[2], "Overhead Press", 3, 10, 65, 1],
      [sids[2], "Barbell Row", 4, 8, 125, 2],
      [sids[2], "Dumbbell Curl", 3, 12, 30, 3],
    ];
    for (const [session_id, exercise_name, sets, reps, weight, sort_order] of logs) {
      await pool.query(
        "INSERT INTO workout_logs (session_id, exercise_name, sets, reps, weight, sort_order) VALUES ($1,$2,$3,$4,$5,$6)",
        [session_id, exercise_name, sets, reps, weight, sort_order]
      );
    }
    console.log(`  ${logs.length} workout log entries created`);
  }

  // --- Measurements ---
  const measurements = [
    [cids[0], d(-42, 9), 158, 28, 36, 30, 38, 12, 22],
    [cids[0], d(-28, 9), 155, 27, 35.5, 29.5, 37.5, 11.8, 21.5],
    [cids[0], d(-14, 9), 152, 25.5, 35, 29, 37, 11.5, 21],
    [cids[0], d(-1, 9), 149, 24, 34.5, 28.5, 37, 11.2, 20.5],

    [cids[1], d(-28, 10), 195, 18, 42, 34, 38, 15, 24],
    [cids[1], d(-14, 10), 198, 17, 42.5, 33.5, 38, 15.5, 24.5],
    [cids[1], d(-1, 10), 200, 16.5, 43, 33, 38, 16, 25],

    [cids[2], d(-21, 9), 145, 30, 34, 32, 39, 11, 22],
    [cids[2], d(-7, 9), 143, 28.5, 33.5, 31, 38.5, 10.8, 21.5],

    [cids[4], d(-10, 11), 130, 25, 33, 27, 36, 10, 20],
  ];
  for (const [client_id, recorded_at, weight_lbs, body_fat_pct, chest_in, waist_in, hips_in, arm_in, thigh_in] of measurements) {
    await pool.query(
      `INSERT INTO measurements (client_id, recorded_at, weight_lbs, body_fat_pct, chest_in, waist_in, hips_in, arm_in, thigh_in, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$2)`,
      [client_id, recorded_at, weight_lbs, body_fat_pct, chest_in, waist_in, hips_in, arm_in, thigh_in]
    );
  }
  console.log(`  ${measurements.length} measurements created`);

  // --- Exercise Library ---
  const exercises = [
    ["Bench Press", "Lie on a flat bench, grip the barbell slightly wider than shoulder-width, lower to chest and press up.", "https://www.youtube.com/watch?v=rT7DgCr-3pg"],
    ["Back Squat", "Bar on upper traps, feet shoulder-width apart, squat until thighs are parallel to the floor.", "https://www.youtube.com/watch?v=ultWZbUMPL8"],
    ["Deadlift", "Hinge at the hips, grip the bar just outside your knees, drive through your heels to stand.", "https://www.youtube.com/watch?v=op9kVnSso6Q"],
    ["Overhead Press", "Press the barbell from shoulder height to full lockout overhead. Keep core tight.", "https://www.youtube.com/watch?v=2yjwXTZQDDI"],
    ["Barbell Row", "Hinge forward 45 degrees, pull the barbell to your lower chest. Squeeze shoulder blades.", null],
    ["Pull-Up", "Hang from a bar with overhand grip, pull yourself up until chin clears the bar.", "https://www.youtube.com/watch?v=eGo4IYlbE5g"],
    ["Romanian Deadlift", "Hold barbell at hip height, hinge forward keeping legs slightly bent, feel the hamstring stretch.", null],
    ["Dumbbell Curl", "Stand with dumbbells at sides, curl up rotating palms to face shoulders at the top.", null],
    ["Plank Hold", "Hold a push-up position on forearms, keep body in a straight line from head to heels.", "https://www.youtube.com/watch?v=ASdvN_XEl_c"],
    ["Kettlebell Swings", "Hinge at hips, swing kettlebell between legs then thrust hips forward to swing to chest height.", "https://www.youtube.com/watch?v=YSxHifyI6s8"],
    ["Box Jumps", "Stand facing a box, swing arms and jump onto the box landing softly with both feet.", null],
    ["Mountain Climbers", "In push-up position, alternate driving knees toward chest at a fast pace.", "https://www.youtube.com/watch?v=nmwgirgXLYM"],
  ];

  for (const [exercise_name, description, video_url] of exercises) {
    await pool.query(
      "INSERT INTO exercises (exercise_name, description, video_url) VALUES ($1, $2, $3)",
      [exercise_name, description, video_url]
    );
  }
  console.log(`  ${exercises.length} exercises created`);

  console.log("Seed complete!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
