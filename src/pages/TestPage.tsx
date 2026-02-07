/**
 * API Test Page - Browser-based testing for Hamsafar Mirza
 * Access at: /app/test
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Play, Loader2 } from 'lucide-react';

// Import all API functions
import * as api from '@/lib/api';
import * as apiWrite from '@/lib/api-write';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export default function TestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runTest = async (
    name: string,
    category: string,
    fn: () => Promise<boolean>
  ): Promise<void> => {
    setCurrentTest(name);
    const start = performance.now();
    try {
      const passed = await fn();
      const duration = performance.now() - start;
      addResult({ name, category, passed, duration });
    } catch (error) {
      const duration = performance.now() - start;
      addResult({
        name,
        category,
        passed: false,
        error: String(error),
        duration,
      });
    }
  };

  const runAllTests = async () => {
    setResults([]);
    setIsRunning(true);

    // ============================================
    // READ OPERATIONS
    // ============================================

    await runTest('getUsers() returns array', 'Read Operations', async () => {
      const users = await api.getUsers();
      return Array.isArray(users) && users.length > 0;
    });

    await runTest('getUsers() has required fields', 'Read Operations', async () => {
      const users = await api.getUsers();
      if (users.length === 0) return false;
      const user = users[0];
      return !!(user.user_id && user.name && user.username && user.email);
    });

    await runTest('getUserById() returns correct user', 'Read Operations', async () => {
      const user = await api.getUserById('user-1');
      return user?.user_id === 'user-1';
    });

    await runTest('getUserById() returns undefined for non-existent', 'Read Operations', async () => {
      const user = await api.getUserById('fake-id');
      return user === undefined;
    });

    await runTest('getProfiles() includes derived attributes', 'Read Operations', async () => {
      const profiles = await api.getProfiles();
      return profiles.every(p => 
        typeof p.followers_count === 'number' && 
        typeof p.following_count === 'number'
      );
    });

    await runTest('getProfiles() includes interests array', 'Read Operations', async () => {
      const profiles = await api.getProfiles();
      return profiles.every(p => Array.isArray(p.interests));
    });

    await runTest('getCities() returns valid cities', 'Read Operations', async () => {
      const cities = await api.getCities();
      return Array.isArray(cities) && cities.length > 0;
    });

    await runTest('getPlaces() includes features and images', 'Read Operations', async () => {
      const places = await api.getPlaces();
      return places.every(p => Array.isArray(p.features) && Array.isArray(p.images));
    });

    await runTest('getPosts() returns sorted posts', 'Read Operations', async () => {
      const posts = await api.getPosts();
      if (posts.length < 2) return true;
      return new Date(posts[0].created_at) >= new Date(posts[1].created_at);
    });

    await runTest('getPosts() includes ratings', 'Read Operations', async () => {
      const posts = await api.getPosts();
      if (posts.length === 0) return false;
      return posts.every(p => typeof p.avg_rating === 'number');
    });

    await runTest('getCompanionRequests() includes conditions', 'Read Operations', async () => {
      const requests = await api.getCompanionRequests();
      return requests.every(r => Array.isArray(r.conditions));
    });

    await runTest('getRegularUsers() returns subtypes', 'Read Operations', async () => {
      const regularUsers = await api.getRegularUsers();
      return Array.isArray(regularUsers);
    });

    // ============================================
    // WRITE OPERATIONS
    // ============================================

    await runTest('createPost() creates new post', 'Write Operations', async () => {
      const { post, error } = await apiWrite.createPost({
        user_id: 'user-1',
        title: `Test Post ${Date.now()}`,
        content: 'Test content',
        experience_type: 'visited',
        images: [],
      });
      return error === null && post !== null;
    });

    await runTest('createPost() sets correct defaults', 'Write Operations', async () => {
      const { post } = await apiWrite.createPost({
        user_id: 'user-1',
        title: 'Default Test',
        content: 'Testing defaults',
        experience_type: 'imagined',
        images: ['https://example.com/img.jpg'],
      });
      return post?.approval_status === 'pending' && post?.avg_rating === 0;
    });

    await runTest('createComment() creates comment', 'Write Operations', async () => {
      const posts = await api.getPosts();
      if (posts.length === 0) return false;
      const { comment, error } = await apiWrite.createComment({
        post_id: posts[0].post_id,
        user_id: 'user-1',
        content: 'Test comment ' + Date.now(),
      });
      return error === null && comment !== null;
    });

    await runTest('createOrUpdateRating() works', 'Write Operations', async () => {
      const posts = await api.getPosts();
      if (posts.length === 0) return false;
      const { error } = await apiWrite.createOrUpdateRating('user-1', posts[0].post_id, 4);
      return error === null;
    });

    await runTest('followUser() creates relationship', 'Write Operations', async () => {
      const { error } = await apiWrite.followUser('user-1', 'user-7');
      return error === null;
    });

    await runTest('followUser() prevents self-follow', 'Write Operations', async () => {
      const { error } = await apiWrite.followUser('user-1', 'user-1');
      return error !== null;
    });

    await runTest('isFollowing() returns boolean', 'Write Operations', async () => {
      const result = await apiWrite.isFollowing('user-1', 'user-2');
      return typeof result === 'boolean';
    });

    await runTest('createCompanionRequest() works', 'Write Operations', async () => {
      const { request, error } = await apiWrite.createCompanionRequest({
        user_id: 'user-1',
        destination_city_id: 'city-1',
        travel_date: '2025-08-01',
        description: 'Test request',
        conditions: ['Test condition'],
      });
      return error === null && request?.status === 'active';
    });

    await runTest('createCompanionMatch() works', 'Write Operations', async () => {
      const requests = await api.getCompanionRequests();
      if (requests.length === 0) return false;
      const { match, error } = await apiWrite.createCompanionMatch({
        request_id: requests[0].request_id,
        companion_user_id: 'user-2',
        message: 'Test match',
      });
      return error === null && match?.status === 'pending';
    });

    // ============================================
    // ERROR HANDLING
    // ============================================

    await runTest('API returns empty array for no results', 'Error Handling', async () => {
      const posts = await api.getPostsByUserId('non-existent');
      return Array.isArray(posts) && posts.length === 0;
    });

    await runTest('API returns undefined for single not found', 'Error Handling', async () => {
      const post = await api.getPostById('non-existent');
      return post === undefined;
    });

    await runTest('Write ops return error object on failure', 'Error Handling', async () => {
      const { error } = await apiWrite.followUser('user-1', 'user-1');
      return error instanceof Error;
    });

    // ============================================
    // DATA VALIDATION
    // ============================================

    await runTest('Users have valid user_type enum', 'Data Validation', async () => {
      const users = await api.getUsers();
      const valid = ['regular', 'moderator', 'admin'];
      return users.every(u => valid.includes(u.user_type));
    });

    await runTest('Posts have valid experience_type enum', 'Data Validation', async () => {
      const posts = await api.getPosts();
      const valid = ['visited', 'imagined'];
      return posts.every(p => valid.includes(p.experience_type));
    });

    await runTest('Posts have valid approval_status enum', 'Data Validation', async () => {
      const posts = await api.getPosts();
      const valid = ['pending', 'approved', 'rejected'];
      return posts.every(p => valid.includes(p.approval_status));
    });

    await runTest('Ratings are 0-5 range', 'Data Validation', async () => {
      const posts = await api.getPosts();
      return posts.every(p => p.avg_rating >= 0 && p.avg_rating <= 5);
    });

    await runTest('Counts are non-negative', 'Data Validation', async () => {
      const profiles = await api.getProfiles();
      return profiles.every(p => p.followers_count >= 0 && p.following_count >= 0);
    });

    await runTest('Dates are valid ISO strings', 'Data Validation', async () => {
      const posts = await api.getPosts();
      return posts.every(p => !isNaN(Date.parse(p.created_at)));
    });

    // ============================================
    // RELATIONSHIP INTEGRITY
    // ============================================

    await runTest('All posts have valid user references', 'Relationships', async () => {
      const posts = await api.getPosts();
      const users = await api.getUsers();
      const userIds = new Set(users.map(u => u.user_id));
      return posts.every(p => userIds.has(p.user_id));
    });

    await runTest('All places reference valid cities', 'Relationships', async () => {
      const places = await api.getPlaces();
      const cities = await api.getCities();
      const cityIds = new Set(cities.map(c => c.city_id));
      return places.every(p => cityIds.has(p.city_id));
    });

    await runTest('No self-follow relationships', 'Relationships', async () => {
      const follows = await api.getFollows();
      return follows.every(f => f.follower_id !== f.following_id);
    });

    await runTest('Users have corresponding profiles', 'Relationships', async () => {
      const users = await api.getUsers();
      const profiles = await api.getProfiles();
      const profileUserIds = new Set(profiles.map(p => p.user_id));
      return users.every(u => profileUserIds.has(u.user_id));
    });

    setIsRunning(false);
    setCurrentTest('');
  };

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const categories = [...new Set(results.map(r => r.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Test Suite</h1>
          <p className="text-muted-foreground">
            Comprehensive testing of all API functions and error handling
          </p>
        </div>
        <Button onClick={runAllTests} disabled={isRunning} size="lg">
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {isRunning && currentTest && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm">Running: {currentTest}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="py-6 text-center">
                <div className="text-4xl font-bold text-green-600">{passed}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6 text-center">
                <div className="text-4xl font-bold text-red-600">{failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-6 text-center">
                <div className="text-4xl font-bold">
                  {results.length > 0 ? ((passed / results.length) * 100).toFixed(0) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Pass Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Results by Category */}
          {categories.map(category => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  {category}
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-600">
                      {results.filter(r => r.category === category && r.passed).length} passed
                    </Badge>
                    {results.filter(r => r.category === category && !r.passed).length > 0 && (
                      <Badge variant="destructive">
                        {results.filter(r => r.category === category && !r.passed).length} failed
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-auto max-h-[400px]">
                  <div className="space-y-2">
                    {results
                      .filter(r => r.category === category)
                      .map((result, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            result.passed ? 'bg-green-50' : 'bg-red-50'
                          }`}
                        >
                          {result.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{result.name}</div>
                            {result.error && (
                              <div className="text-xs text-red-600 mt-1 font-mono">
                                {result.error}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0">
                            {result.duration.toFixed(1)}ms
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {results.length === 0 && !isRunning && (
        <Card className="py-12 text-center">
          <CardContent>
            <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Click "Run All Tests" to start the test suite
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
