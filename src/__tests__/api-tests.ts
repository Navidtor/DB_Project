/**
 * API Layer Test Suite
 * This file tests all API functions and error handling
 * Run with: npx tsx src/__tests__/api-tests.ts
 */

// Import all API functions
import * as api from '../lib/api';
import * as apiWrite from '../lib/api-write';

// Test utilities
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const log = {
  pass: (msg: string) => console.log(`${colors.green}✓ PASS${colors.reset} ${msg}`),
  fail: (msg: string, error?: unknown) => {
    console.log(`${colors.red}✗ FAIL${colors.reset} ${msg}`);
    if (error) console.log(`  ${colors.red}Error: ${error}${colors.reset}`);
  },
  info: (msg: string) => console.log(`${colors.blue}ℹ INFO${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.bold}${colors.yellow}=== ${msg} ===${colors.reset}\n`),
};

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<boolean>): Promise<void> {
  try {
    const passed = await fn();
    if (passed) {
      log.pass(name);
      results.push({ name, passed: true });
    } else {
      log.fail(name);
      results.push({ name, passed: false });
    }
  } catch (error) {
    log.fail(name, error);
    results.push({ name, passed: false, error: String(error) });
  }
}

// ============================================
// READ OPERATIONS TESTS
// ============================================

async function testReadOperations() {
  log.section('READ OPERATIONS');

  // Test getUsers
  await test('getUsers() returns array of users', async () => {
    const users = await api.getUsers();
    return Array.isArray(users) && users.length > 0;
  });

  await test('getUsers() returns users with required fields', async () => {
    const users = await api.getUsers();
    const user = users[0];
    return !!(user.user_id && user.name && user.username && user.email && user.user_type);
  });

  // Test getUserById
  await test('getUserById() returns correct user', async () => {
    const user = await api.getUserById('user-1');
    return user?.user_id === 'user-1';
  });

  await test('getUserById() returns undefined for non-existent user', async () => {
    const user = await api.getUserById('non-existent-user');
    return user === undefined;
  });

  // Test getProfiles
  await test('getProfiles() returns array of profiles', async () => {
    const profiles = await api.getProfiles();
    return Array.isArray(profiles) && profiles.length > 0;
  });

  await test('getProfiles() includes derived attributes (followers_count, following_count)', async () => {
    const profiles = await api.getProfiles();
    const profile = profiles[0];
    return typeof profile.followers_count === 'number' && typeof profile.following_count === 'number';
  });

  await test('getProfiles() includes multi-valued attribute (interests)', async () => {
    const profiles = await api.getProfiles();
    const profile = profiles[0];
    return Array.isArray(profile.interests);
  });

  // Test getProfileByUserId
  await test('getProfileByUserId() returns correct profile', async () => {
    const profile = await api.getProfileByUserId('user-1');
    return profile?.user_id === 'user-1';
  });

  // Test getCities
  await test('getCities() returns array of cities', async () => {
    const cities = await api.getCities();
    return Array.isArray(cities) && cities.length > 0;
  });

  await test('getCities() filters out placeholder images', async () => {
    const cities = await api.getCities();
    return cities.every(city => !city.image?.includes('placehold.co'));
  });

  // Test getPlaces
  await test('getPlaces() returns array of places', async () => {
    const places = await api.getPlaces();
    return Array.isArray(places) && places.length > 0;
  });

  await test('getPlaces() includes multi-valued attributes (features, images)', async () => {
    const places = await api.getPlaces();
    const place = places[0];
    return Array.isArray(place.features) && Array.isArray(place.images);
  });

  // Test getPosts
  await test('getPosts() returns array of posts', async () => {
    const posts = await api.getPosts();
    return Array.isArray(posts) && posts.length > 0;
  });

  await test('getPosts() includes derived attributes (avg_rating, rating_count)', async () => {
    const posts = await api.getPosts();
    const post = posts[0];
    return typeof post.avg_rating === 'number' && typeof post.rating_count === 'number';
  });

  await test('getPosts() includes multi-valued attribute (images)', async () => {
    const posts = await api.getPosts();
    const post = posts[0];
    return Array.isArray(post.images);
  });

  await test('getPosts() are sorted by created_at descending', async () => {
    const posts = await api.getPosts();
    if (posts.length < 2) return true;
    return new Date(posts[0].created_at) >= new Date(posts[1].created_at);
  });

  // Test getPostById
  await test('getPostById() returns correct post', async () => {
    const posts = await api.getPosts();
    const post = await api.getPostById(posts[0].post_id);
    return post?.post_id === posts[0].post_id;
  });

  // Test getPostsByUserId
  await test('getPostsByUserId() returns posts for specific user', async () => {
    const posts = await api.getPostsByUserId('user-1');
    return Array.isArray(posts) && posts.every(post => post.user_id === 'user-1');
  });

  // Test getCommentsByPostId
  await test('getCommentsByPostId() returns array of comments', async () => {
    const posts = await api.getPosts();
    const comments = await api.getCommentsByPostId(posts[0].post_id);
    return Array.isArray(comments);
  });

  // Test getCompanionRequests
  await test('getCompanionRequests() returns array of requests', async () => {
    const requests = await api.getCompanionRequests();
    return Array.isArray(requests) && requests.length > 0;
  });

  await test('getCompanionRequests() includes multi-valued attribute (conditions)', async () => {
    const requests = await api.getCompanionRequests();
    const request = requests[0];
    return Array.isArray(request.conditions);
  });

  // Test getCompanionMatches
  await test('getCompanionMatches() returns array of matches', async () => {
    const matches = await api.getCompanionMatches();
    return Array.isArray(matches);
  });

  // Test getFollows
  await test('getFollows() returns array of follow relationships', async () => {
    const follows = await api.getFollows();
    return Array.isArray(follows);
  });

  // Test user subtypes
  await test('getRegularUsers() returns regular user subtypes', async () => {
    const regularUsers = await api.getRegularUsers();
    return Array.isArray(regularUsers) && regularUsers.length > 0;
  });

  await test('getModerators() returns moderator subtypes', async () => {
    const moderators = await api.getModerators();
    return Array.isArray(moderators);
  });

  await test('getAdmins() returns admin subtypes', async () => {
    const admins = await api.getAdmins();
    return Array.isArray(admins);
  });
}

// ============================================
// WRITE OPERATIONS TESTS (Mock Mode)
// ============================================

async function testWriteOperations() {
  log.section('WRITE OPERATIONS (Mock Mode)');

  // Test createPost
  await test('createPost() creates a new post', async () => {
    const initialPosts = await api.getPosts();
    const initialCount = initialPosts.length;

    const { post, error } = await apiWrite.createPost({
      user_id: 'user-1',
      title: 'Test Post',
      content: 'This is a test post content',
      experience_type: 'visited',
      city_id: 'city-1',
      images: ['https://example.com/image.jpg'],
    });

    const newPosts = await api.getPosts();
    return error === null && post !== null && newPosts.length === initialCount + 1;
  });

  await test('createPost() returns post with correct data', async () => {
    const { post, error } = await apiWrite.createPost({
      user_id: 'user-2',
      title: 'Another Test',
      content: 'Content here',
      experience_type: 'imagined',
      images: [],
    });

    return (
      error === null &&
      post !== null &&
      post.title === 'Another Test' &&
      post.experience_type === 'imagined' &&
      post.approval_status === 'pending'
    );
  });

  // Test updatePost
  await test('updatePost() updates post data', async () => {
    const posts = await api.getPosts();
    const postId = posts[0].post_id;

    const { error } = await apiWrite.updatePost(postId, {
      title: 'Updated Title',
    });

    const updatedPost = await api.getPostById(postId);
    return error === null && updatedPost?.title === 'Updated Title';
  });

  // Test createComment
  await test('createComment() creates a new comment', async () => {
    const posts = await api.getPosts();
    const postId = posts[0].post_id;

    const { comment, error } = await apiWrite.createComment({
      post_id: postId,
      user_id: 'user-1',
      content: 'This is a test comment',
    });

    return error === null && comment !== null && comment.content === 'This is a test comment';
  });

  // Test createOrUpdateRating
  await test('createOrUpdateRating() creates a rating', async () => {
    const posts = await api.getPosts();
    const postId = posts[0].post_id;

    const { error } = await apiWrite.createOrUpdateRating('user-1', postId, 5);
    return error === null;
  });

  // Test followUser
  await test('followUser() creates follow relationship', async () => {
    const { error } = await apiWrite.followUser('user-1', 'user-5');
    return error === null;
  });

  await test('followUser() prevents self-follow', async () => {
    const { error } = await apiWrite.followUser('user-1', 'user-1');
    return error !== null && error.message === 'Cannot follow yourself';
  });

  // Test isFollowing
  await test('isFollowing() returns correct status', async () => {
    // First follow
    await apiWrite.followUser('user-2', 'user-3');
    const isFollowing = await apiWrite.isFollowing('user-2', 'user-3');
    return isFollowing === true;
  });

  // Test unfollowUser
  await test('unfollowUser() removes follow relationship', async () => {
    await apiWrite.followUser('user-1', 'user-6');
    const { error } = await apiWrite.unfollowUser('user-1', 'user-6');
    const stillFollowing = await apiWrite.isFollowing('user-1', 'user-6');
    return error === null && stillFollowing === false;
  });

  // Test createCompanionRequest
  await test('createCompanionRequest() creates a request', async () => {
    const { request, error } = await apiWrite.createCompanionRequest({
      user_id: 'user-1',
      destination_city_id: 'city-1',
      travel_date: '2025-06-15',
      description: 'Looking for a travel companion',
      conditions: ['Non-smoker', 'Early riser'],
    });

    return (
      error === null &&
      request !== null &&
      request.status === 'active' &&
      request.conditions?.length === 2
    );
  });

  // Test updateCompanionRequestStatus
  await test('updateCompanionRequestStatus() updates status', async () => {
    const requests = await api.getCompanionRequests();
    const activeRequest = requests.find(r => r.status === 'active');
    if (!activeRequest) return true; // Skip if no active request

    const { error } = await apiWrite.updateCompanionRequestStatus(activeRequest.request_id, 'cancelled');
    return error === null;
  });

  // Test createCompanionMatch
  await test('createCompanionMatch() creates a match', async () => {
    const requests = await api.getCompanionRequests();
    const requestId = requests[0].request_id;

    const { match, error } = await apiWrite.createCompanionMatch({
      request_id: requestId,
      companion_user_id: 'user-3',
      message: 'I would love to join!',
    });

    return error === null && match !== null && match.status === 'pending';
  });

  // Test updateCompanionMatchStatus
  await test('updateCompanionMatchStatus() updates match status', async () => {
    const matches = await api.getCompanionMatches();
    const pendingMatch = matches.find(m => m.status === 'pending');
    if (!pendingMatch) return true;

    const { error } = await apiWrite.updateCompanionMatchStatus(pendingMatch.match_id, 'accepted');
    return error === null;
  });

  // Test deleteComment
  await test('deleteComment() removes a comment', async () => {
    const posts = await api.getPosts();
    const comments = await api.getCommentsByPostId(posts[0].post_id);
    if (comments.length === 0) return true;

    const { error } = await apiWrite.deleteComment(comments[0].comment_id);
    return error === null;
  });

  // Test deletePost
  await test('deletePost() removes a post', async () => {
    const posts = await api.getPosts();
    const initialCount = posts.length;
    const postId = posts[posts.length - 1].post_id; // Delete last post

    const { error } = await apiWrite.deletePost(postId);
    const newPosts = await api.getPosts();

    return error === null && newPosts.length === initialCount - 1;
  });
}

// ============================================
// ERROR HANDLING TESTS
// ============================================

async function testErrorHandling() {
  log.section('ERROR HANDLING');

  // Test return types on success
  await test('API write functions return { data, error: null } on success', async () => {
    const { post, error } = await apiWrite.createPost({
      user_id: 'user-1',
      title: 'Error Test Post',
      content: 'Testing error handling',
      experience_type: 'visited',
      images: [],
    });
    return error === null && post !== null;
  });

  // Test self-follow prevention
  await test('followUser() returns error for self-follow', async () => {
    const { error } = await apiWrite.followUser('user-1', 'user-1');
    return error !== null;
  });

  // Test missing data handling
  await test('getPostById() handles non-existent post gracefully', async () => {
    const post = await api.getPostById('non-existent-post-id');
    return post === undefined;
  });

  await test('getUserById() handles non-existent user gracefully', async () => {
    const user = await api.getUserById('non-existent-user-id');
    return user === undefined;
  });

  await test('getProfileByUserId() handles non-existent profile gracefully', async () => {
    const profile = await api.getProfileByUserId('non-existent-user-id');
    return profile === undefined;
  });

  // Test empty array returns
  await test('getPostsByUserId() returns empty array for user with no posts', async () => {
    const posts = await api.getPostsByUserId('non-existent-user');
    return Array.isArray(posts) && posts.length === 0;
  });

  await test('getCommentsByPostId() returns empty array for post with no comments', async () => {
    const comments = await api.getCommentsByPostId('non-existent-post');
    return Array.isArray(comments) && comments.length === 0;
  });
}

// ============================================
// DATA VALIDATION TESTS
// ============================================

async function testDataValidation() {
  log.section('DATA VALIDATION');

  // Test user types
  await test('Users have valid user_type (regular|moderator|admin)', async () => {
    const users = await api.getUsers();
    const validTypes = ['regular', 'moderator', 'admin'];
    return users.every(user => validTypes.includes(user.user_type));
  });

  // Test experience types
  await test('Posts have valid experience_type (visited|imagined)', async () => {
    const posts = await api.getPosts();
    const validTypes = ['visited', 'imagined'];
    return posts.every(post => validTypes.includes(post.experience_type));
  });

  // Test approval status
  await test('Posts have valid approval_status (pending|approved|rejected)', async () => {
    const posts = await api.getPosts();
    const validStatuses = ['pending', 'approved', 'rejected'];
    return posts.every(post => validStatuses.includes(post.approval_status));
  });

  // Test request status
  await test('CompanionRequests have valid status (active|completed|cancelled)', async () => {
    const requests = await api.getCompanionRequests();
    const validStatuses = ['active', 'completed', 'cancelled'];
    return requests.every(request => validStatuses.includes(request.status));
  });

  // Test match status
  await test('CompanionMatches have valid status (pending|accepted|rejected)', async () => {
    const matches = await api.getCompanionMatches();
    const validStatuses = ['pending', 'accepted', 'rejected'];
    return matches.every(match => validStatuses.includes(match.status));
  });

  // Test date formats
  await test('Posts have valid ISO date strings for created_at', async () => {
    const posts = await api.getPosts();
    return posts.every(post => !isNaN(Date.parse(post.created_at)));
  });

  // Test numeric derived attributes
  await test('Profiles have non-negative followers_count and following_count', async () => {
    const profiles = await api.getProfiles();
    return profiles.every(p => p.followers_count >= 0 && p.following_count >= 0);
  });

  await test('Posts have non-negative avg_rating and rating_count', async () => {
    const posts = await api.getPosts();
    return posts.every(p => p.avg_rating >= 0 && p.rating_count >= 0);
  });

  await test('Posts avg_rating is between 0 and 5', async () => {
    const posts = await api.getPosts();
    return posts.every(p => p.avg_rating >= 0 && p.avg_rating <= 5);
  });
}

// ============================================
// RELATIONSHIP TESTS
// ============================================

async function testRelationships() {
  log.section('RELATIONSHIP INTEGRITY');

  // Test User-Profile relationship (1:1)
  await test('Each user has exactly one profile', async () => {
    const users = await api.getUsers();
    const profiles = await api.getProfiles();
    const profileUserIds = new Set(profiles.map(p => p.user_id));
    return users.every(user => profileUserIds.has(user.user_id));
  });

  // Test Post-User relationship
  await test('All posts reference valid users', async () => {
    const posts = await api.getPosts();
    const users = await api.getUsers();
    const userIds = new Set(users.map(u => u.user_id));
    return posts.every(post => userIds.has(post.user_id));
  });

  // Test Place-City relationship
  await test('All places reference valid cities', async () => {
    const places = await api.getPlaces();
    const cities = await api.getCities();
    const cityIds = new Set(cities.map(c => c.city_id));
    return places.every(place => cityIds.has(place.city_id));
  });

  // Test CompanionRequest-User relationship
  await test('All companion requests reference valid users', async () => {
    const requests = await api.getCompanionRequests();
    const users = await api.getUsers();
    const userIds = new Set(users.map(u => u.user_id));
    return requests.every(request => userIds.has(request.user_id));
  });

  // Test Follow relationships
  await test('Follows have valid follower and following users', async () => {
    const follows = await api.getFollows();
    const users = await api.getUsers();
    const userIds = new Set(users.map(u => u.user_id));
    return follows.every(f => userIds.has(f.follower_id) && userIds.has(f.following_id));
  });

  // Test no self-follows in data
  await test('No self-follow relationships exist', async () => {
    const follows = await api.getFollows();
    return follows.every(f => f.follower_id !== f.following_id);
  });
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          HAMSAFAR MIRZA - API TEST SUITE                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  log.info('Running in Mock Data Mode');
  log.info(`Timestamp: ${new Date().toISOString()}`);

  await testReadOperations();
  await testWriteOperations();
  await testErrorHandling();
  await testDataValidation();
  await testRelationships();

  // Summary
  log.section('TEST SUMMARY');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total:  ${total}`);
  console.log(`Pass Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    results
      .filter(r => !r.passed)
      .forEach(r => console.log(`  - ${r.name}${r.error ? `: ${r.error}` : ''}`));
  }

  console.log('');
  return failed === 0;
}

// Run tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
