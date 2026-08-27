import {
  collectUserData,
  purgeUserData,
  restoreUserData,
  countUserData,
  isUserScopedKey
} from './storageRegistry';

const ALI = 'ali@x.com';
const SARA = 'sara@x.com';

// A user whose email contains the other user's email as a suffix, which is what
// a naive `endsWith` match would mis-attribute.
const DEEP = 'deep_ali@x.com';

const json = (key) => JSON.parse(localStorage.getItem(key));

const seed = () => {
  localStorage.clear();

  localStorage.setItem(
    'stellar_users',
    JSON.stringify({
      [ALI]: { email: ALI, password: 'pw-ali', role: 'student', createdAt: '2026-01-01', name: 'Ali', bio: 'hi', profilePicture: '🦊' },
      [SARA]: { email: SARA, password: 'pw-sara', role: 'teacher', createdAt: '2026-01-02', name: 'Sara' },
      [DEEP]: { email: DEEP, password: 'pw-deep', role: 'student', createdAt: '2026-01-03', name: 'Deep' }
    })
  );

  // User-scoped keys, one set per user.
  localStorage.setItem(`stellar_points_${ALI}`, JSON.stringify({ total: 120 }));
  localStorage.setItem(`stellar_streak_${ALI}`, JSON.stringify({ current: 4 }));
  localStorage.setItem(`stellar_achievements_${ALI}`, JSON.stringify(['first_word']));
  localStorage.setItem(`stellar_quiz_history_${ALI}`, JSON.stringify([{ score: 9 }]));
  localStorage.setItem(`stellar_certificates_${ALI}`, JSON.stringify([{ id: 'c1' }]));
  localStorage.setItem(`stellar_points_notifications_${ALI}`, JSON.stringify([{ points: 5 }]));
  localStorage.setItem(`alphabet_learned_${ALI}`, JSON.stringify(['alef']));
  // A key no registry prefix knows about - the generic suffix match must find it.
  localStorage.setItem(`stellar_future_feature_${ALI}`, JSON.stringify({ x: 1 }));

  localStorage.setItem(`stellar_points_${SARA}`, JSON.stringify({ total: 900 }));
  localStorage.setItem(`stellar_points_${DEEP}`, JSON.stringify({ total: 7 }));

  // Device-scoped module progress.
  localStorage.setItem('arabic_wordbuilder_progress', JSON.stringify({ totalPoints: 60 }));
  localStorage.setItem('arabic_learning_progress', JSON.stringify({ lessons: 3 }));
  localStorage.setItem('stellar_saved_chats', JSON.stringify([{ id: 'chat_1' }]));

  // Preferences.
  localStorage.setItem('stellar_dark_mode', 'true');
  localStorage.setItem('stellar_font', "'Cairo', sans-serif");
  localStorage.setItem('app-language', 'ar');
  localStorage.setItem('high-contrast', 'true');

  // Shared containers.
  localStorage.setItem(
    'stellar_user_stats',
    JSON.stringify({
      [ALI]: { email: ALI, totalPoints: 120 },
      [SARA]: { email: SARA, totalPoints: 900 }
    })
  );
  localStorage.setItem(
    'stellar_module_progress',
    JSON.stringify({
      [ALI]: { alphabet: { learned: ['alef'], total: 28 } },
      [SARA]: { colors: { learned: ['red'], total: 10 } }
    })
  );
  localStorage.setItem(
    'stellar_conversations',
    JSON.stringify({
      conv1: { id: 'conv1', participants: [ALI, SARA] },
      conv2: { id: 'conv2', participants: [SARA, DEEP] }
    })
  );
  localStorage.setItem('stellar_messages_conv1', JSON.stringify([{ text: 'salam' }]));
  localStorage.setItem('stellar_messages_conv2', JSON.stringify([{ text: 'other thread' }]));

  localStorage.setItem(
    'stellar_homework',
    JSON.stringify([
      { id: 'hw1', createdBy: SARA, assignedTo: 'all', assignedToGroup: [ALI, DEEP], completions: [{ studentEmail: ALI, completedAt: 't1' }, { studentEmail: DEEP, completedAt: 't2' }] },
      { id: 'hw2', createdBy: ALI, assignedTo: SARA, completions: [] }
    ])
  );
  localStorage.setItem(
    'stellar_assignments',
    JSON.stringify({
      a1: { id: 'a1', teacherEmail: SARA, submissions: { [ALI]: { grade: 8 }, [DEEP]: { grade: 6 } } },
      a2: { id: 'a2', teacherEmail: ALI, submissions: {} }
    })
  );
  localStorage.setItem(
    'stellar_classes',
    JSON.stringify({
      c1: {
        id: 'c1',
        teacherEmail: SARA,
        students: [{ email: ALI, name: 'Ali' }, { email: DEEP, name: 'Deep' }],
        totalStudents: 2
      }
    })
  );
  localStorage.setItem(
    'stellar_student_enrollments',
    JSON.stringify({ [ALI]: [{ classId: 'c1' }], [DEEP]: [{ classId: 'c1' }] })
  );

  // Unrelated data from another app on the same origin - must never be touched.
  localStorage.setItem('some_other_app_token', 'keep-me');
};

beforeEach(seed);

describe('isUserScopedKey', () => {
  const known = [ALI, SARA, DEEP];

  it('matches the user own suffixed keys', () => {
    expect(isUserScopedKey(`stellar_points_${ALI}`, ALI, known)).toBe(true);
    expect(isUserScopedKey(`stellar_points_notifications_${ALI}`, ALI, known)).toBe(true);
  });

  it('does not claim a longer email that ends with the same suffix', () => {
    expect(isUserScopedKey(`stellar_points_${DEEP}`, ALI, known)).toBe(false);
    expect(isUserScopedKey(`stellar_points_${DEEP}`, DEEP, known)).toBe(true);
  });

  it('ignores keys that do not belong to the app', () => {
    expect(isUserScopedKey(`other_app_${ALI}`, ALI, known)).toBe(false);
  });
});

describe('collectUserData', () => {
  it('captures user-scoped, device and preference keys', () => {
    const { standalone } = collectUserData(ALI);

    [
      `stellar_points_${ALI}`,
      `stellar_streak_${ALI}`,
      `stellar_achievements_${ALI}`,
      `stellar_quiz_history_${ALI}`,
      `stellar_certificates_${ALI}`,
      `stellar_points_notifications_${ALI}`,
      `alphabet_learned_${ALI}`,
      `stellar_future_feature_${ALI}`,
      'arabic_wordbuilder_progress',
      'arabic_learning_progress',
      'stellar_saved_chats',
      'stellar_dark_mode',
      'stellar_font',
      'app-language',
      'high-contrast',
      'stellar_messages_conv1'
    ].forEach((key) => expect(Object.keys(standalone)).toContain(key));
  });

  it('does not capture another user data', () => {
    const { standalone, shared } = collectUserData(ALI);

    expect(standalone).not.toHaveProperty([`stellar_points_${SARA}`]);
    expect(standalone).not.toHaveProperty([`stellar_points_${DEEP}`]);
    expect(standalone).not.toHaveProperty('stellar_messages_conv2');
    expect(shared['stellar_user_stats']).not.toHaveProperty([SARA]);
    expect(shared['stellar_conversations']).not.toHaveProperty('conv2');
  });

  it('slices shared containers down to the user share', () => {
    const { shared } = collectUserData(ALI);

    expect(shared['stellar_user_stats']).toEqual({ [ALI]: { email: ALI, totalPoints: 120 } });
    expect(shared['stellar_conversations']).toHaveProperty('conv1');
    expect(shared['stellar_assignments'].a1.submissions).toEqual({ [ALI]: { grade: 8 } });
    expect(shared['stellar_classes'].c1.students).toEqual([{ email: ALI, name: 'Ali' }]);
    expect(shared['stellar_homework'].map((hw) => hw.id).sort()).toEqual(['hw1', 'hw2']);
  });
});

describe('purgeUserData', () => {
  it('leaves nothing of the user behind', () => {
    purgeUserData(ALI);

    // The account record is deliberately preserved so the user can re-import.
    expect(countUserData(ALI, { ignoreKeys: ['stellar_users'] })).toBe(0);
  });

  it('keeps credentials but clears the profile', () => {
    purgeUserData(ALI);

    const users = json('stellar_users');
    expect(users[ALI]).toEqual({
      email: ALI,
      password: 'pw-ali',
      role: 'student',
      createdAt: '2026-01-01'
    });
    expect(users[ALI].name).toBeUndefined();
  });

  it('removes the account entirely when asked', () => {
    purgeUserData(ALI, { dropAccount: true });
    expect(json('stellar_users')).not.toHaveProperty([ALI]);
  });

  it('does not touch other users or other apps', () => {
    purgeUserData(ALI);

    expect(json(`stellar_points_${SARA}`)).toEqual({ total: 900 });
    expect(json(`stellar_points_${DEEP}`)).toEqual({ total: 7 });
    expect(json('stellar_user_stats')[SARA]).toEqual({ email: SARA, totalPoints: 900 });
    expect(json('stellar_module_progress')[SARA]).toBeDefined();
    expect(json('stellar_messages_conv2')).toEqual([{ text: 'other thread' }]);
    expect(json('stellar_conversations')).toHaveProperty('conv2');
    expect(localStorage.getItem('some_other_app_token')).toBe('keep-me');
  });

  it('scrubs the user out of records owned by someone else', () => {
    purgeUserData(ALI);

    const homework = json('stellar_homework');
    const hw1 = homework.find((hw) => hw.id === 'hw1');
    expect(homework.find((hw) => hw.id === 'hw2')).toBeUndefined(); // Ali created it
    expect(hw1.assignedToGroup).toEqual([DEEP]);
    expect(hw1.completions).toEqual([{ studentEmail: DEEP, completedAt: 't2' }]);

    expect(json('stellar_assignments').a1.submissions).toEqual({ [DEEP]: { grade: 6 } });
    expect(json('stellar_assignments')).not.toHaveProperty('a2'); // Ali was the teacher

    const c1 = json('stellar_classes').c1;
    expect(c1.students).toEqual([{ email: DEEP, name: 'Deep' }]);
    expect(c1.totalStudents).toBe(1);

    expect(json('stellar_student_enrollments')).not.toHaveProperty([ALI]);
    expect(json('stellar_student_enrollments')).toHaveProperty([DEEP]);
  });

  it('wipes device and preference keys', () => {
    purgeUserData(ALI);

    ['arabic_wordbuilder_progress', 'arabic_learning_progress', 'stellar_saved_chats',
     'stellar_dark_mode', 'stellar_font', 'app-language', 'high-contrast']
      .forEach((key) => expect(localStorage.getItem(key)).toBeNull());
  });
});

describe('export -> delete -> import round trip', () => {
  it('restores the user data exactly', () => {
    const snapshot = collectUserData(ALI);
    const serialised = JSON.parse(JSON.stringify(snapshot)); // survives a file write

    purgeUserData(ALI);
    restoreUserData(serialised, ALI);

    const after = collectUserData(ALI);
    expect(after.standalone).toEqual(snapshot.standalone);
    expect(after.shared).toEqual(snapshot.shared);
  });

  it('brings back individual values, not just key names', () => {
    const snapshot = JSON.parse(JSON.stringify(collectUserData(ALI)));

    purgeUserData(ALI);
    restoreUserData(snapshot, ALI);

    expect(json(`stellar_points_${ALI}`)).toEqual({ total: 120 });
    expect(json(`stellar_streak_${ALI}`)).toEqual({ current: 4 });
    expect(json(`stellar_future_feature_${ALI}`)).toEqual({ x: 1 });
    expect(json('arabic_wordbuilder_progress')).toEqual({ totalPoints: 60 });
    expect(localStorage.getItem('stellar_dark_mode')).toBe('true');
    expect(localStorage.getItem('app-language')).toBe('ar');
    expect(json('stellar_messages_conv1')).toEqual([{ text: 'salam' }]);
    expect(json('stellar_user_stats')[ALI]).toEqual({ email: ALI, totalPoints: 120 });
    expect(json('stellar_users')[ALI].name).toBe('Ali');
    expect(json('stellar_users')[ALI].profilePicture).toBe('🦊');
  });

  it('does not disturb other users while restoring', () => {
    const snapshot = JSON.parse(JSON.stringify(collectUserData(ALI)));
    const saraStatsBefore = json('stellar_user_stats')[SARA];

    purgeUserData(ALI);
    restoreUserData(snapshot, ALI);

    expect(json('stellar_user_stats')[SARA]).toEqual(saraStatsBefore);
    expect(json(`stellar_points_${SARA}`)).toEqual({ total: 900 });
    expect(json('stellar_conversations')).toHaveProperty('conv2');
    expect(json('stellar_users')[SARA].password).toBe('pw-sara');
  });

  it('never lets an imported file overwrite the live password', () => {
    const snapshot = JSON.parse(JSON.stringify(collectUserData(ALI)));
    snapshot.shared['stellar_users'][ALI].password = 'attacker-supplied';

    purgeUserData(ALI);
    restoreUserData(snapshot, ALI);

    expect(json('stellar_users')[ALI].password).toBe('pw-ali');
  });
});
