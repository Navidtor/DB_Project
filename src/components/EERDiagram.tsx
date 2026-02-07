import React from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Color mapping for entity headers (Tailwind can't detect dynamic classes)
const colorMap: Record<string, string> = {
  'border-blue-600': 'bg-blue-600',
  'border-sky-500': 'bg-sky-500',
  'border-amber-500': 'bg-amber-500',
  'border-red-500': 'bg-red-500',
  'border-purple-600': 'bg-purple-600',
  'border-green-600': 'bg-green-600',
  'border-cyan-600': 'bg-cyan-600',
  'border-orange-600': 'bg-orange-600',
  'border-teal-600': 'bg-teal-600',
  'border-pink-600': 'bg-pink-600',
  'border-rose-600': 'bg-rose-600',
};

// Custom Entity Node Component (Rectangle - Strong Entity)
const EntityNode = ({ data }: { data: { label: string; attributes: string[]; color: string; isWeak?: boolean } }) => {
  const bgColor = colorMap[data.color] || 'bg-gray-600';
  
  return (
    <div className={`rounded-lg shadow-lg ${data.isWeak ? 'border-[6px] border-double ring-2 ring-offset-2' : 'border-2'} ${data.color} ${data.isWeak ? 'ring-current' : ''} bg-white min-w-[220px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      {/* Entity Name Header */}
      <div className={`px-4 py-3 font-bold text-white rounded-t-md text-base text-center ${bgColor}`}>
        {data.label}
      </div>
      {/* Attributes */}
      <div className="p-3 space-y-1">
        {data.attributes.map((attr, index) => (
          <div key={index} className="text-sm text-gray-700 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              attr.startsWith('PK:') ? 'bg-yellow-500' : 
              attr.startsWith('FK:') ? 'bg-blue-500' : 
              attr.startsWith('DERIVED:') ? 'bg-green-500' :
              'bg-gray-400'
            }`}></span>
            {attr}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Specialization/Generalization Node (Circle with 'd' or 'o')
const SpecializationNode = ({ data }: { data: { type: 'disjoint' | 'overlapping'; total: boolean } }) => {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className={`w-12 h-12 rounded-full border-2 border-gray-800 bg-white flex items-center justify-center font-bold text-lg ${data.total ? 'border-double border-4' : ''}`}>
        {data.type === 'disjoint' ? 'd' : 'o'}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      <Handle type="source" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

// Subtype Entity Node (for specialization)
const SubtypeNode = ({ data }: { data: { label: string; attributes: string[]; color: string } }) => {
  const bgColor = colorMap[data.color] || 'bg-gray-600';
  
  return (
    <div className={`rounded-lg shadow-lg border-2 ${data.color} bg-gradient-to-b from-white to-gray-50 min-w-[200px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      {/* Subtype Name Header */}
      <div className={`px-3 py-2 font-bold text-white rounded-t-md text-sm text-center ${bgColor}`}>
        {data.label}
      </div>
      <div className="p-2 space-y-1">
        {data.attributes.map((attr, index) => (
          <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            {attr}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

// Relationship Diamond Node (Proper EER Diamond Shape)
const RelationshipNode = ({ data }: { data: { label: string; attributes?: string[] } }) => {
  return (
    <div className="relative flex flex-col items-center">
      <Handle type="target" position={Position.Top} className="w-3 h-3" style={{ top: -5 }} />
      <Handle type="target" position={Position.Left} className="w-3 h-3" style={{ left: -5 }} />
      {/* Diamond shape using CSS clip-path */}
      <div 
        className="w-32 h-20 bg-yellow-100 border-2 border-yellow-600 flex items-center justify-center"
        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
      >
        <span className="text-sm font-bold text-yellow-800 text-center px-2 leading-tight">
          {data.label}
        </span>
      </div>
      {data.attributes && data.attributes.length > 0 && (
        <div className="mt-2 bg-yellow-50 border border-yellow-300 rounded px-2 py-1 text-xs">
          {data.attributes.map((attr, i) => (
            <div key={i}>{attr}</div>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ bottom: -5 }} />
      <Handle type="source" position={Position.Right} className="w-3 h-3" style={{ right: -5 }} />
    </div>
  );
};

// Multi-valued Attribute Node (Double Ellipse)
const MultiValuedNode = ({ data }: { data: { label: string } }) => {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="px-3 py-1 rounded-full border-4 border-double border-purple-500 bg-purple-50 text-xs font-medium text-purple-700">
        {data.label}
      </div>
    </div>
  );
};

// Derived Attribute Node (Dashed Ellipse)
const DerivedNode = ({ data }: { data: { label: string } }) => {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="px-3 py-1 rounded-full border-2 border-dashed border-green-500 bg-green-50 text-xs font-medium text-green-700">
        {data.label}
      </div>
    </div>
  );
};

const nodeTypes = {
  entity: EntityNode,
  specialization: SpecializationNode,
  subtype: SubtypeNode,
  relationship: RelationshipNode,
  multivalued: MultiValuedNode,
  derived: DerivedNode,
};

// EER Diagram Nodes - Organized Layout
// Layout: 
// TOP CENTER: Users + Specialization hierarchy
// LEFT: Profile & Social features  
// CENTER: Content (Posts, Places, Cities) - vertical flow
// RIGHT: Companion features

const initialNodes: Node[] = [
  // ==================== ROW 1: USER HIERARCHY (CENTER-TOP) ====================
  {
    id: 'users',
    type: 'entity',
    position: { x: 600, y: 50 },
    data: {
      label: 'USERS',
      attributes: [
        'PK: user_id',
        'name (نام)',
        'username (نام کاربری)',
        'email (ایمیل)',
        'phone (شماره تماس)',
        'password_hash (رمزعبور)',
        'profile_image (تصویر پروفایل)',
        'created_at (تاریخ ایجاد)',
      ],
      color: 'border-blue-600',
    },
  },
  
  // Specialization Circle (Disjoint, Total)
  {
    id: 'user-specialization',
    type: 'specialization',
    position: { x: 680, y: 310 },
    data: { type: 'disjoint', total: true },
  },
  
  // ==================== ROW 2: USER SUBTYPES ====================
  {
    id: 'regular-user',
    type: 'subtype',
    position: { x: 450, y: 400 },
    data: {
      label: 'REGULAR_USER',
      attributes: [
        'travel_preferences (ترجیحات سفر)',
        'experience_level (سطح تجربه)',
      ],
      color: 'border-sky-500',
    },
  },
  {
    id: 'moderator',
    type: 'subtype',
    position: { x: 650, y: 400 },
    data: {
      label: 'MODERATOR',
      attributes: [
        'assigned_regions (مناطق تحت نظارت)',
        'approval_count (تعداد تأییدها)',
      ],
      color: 'border-amber-500',
    },
  },
  {
    id: 'admin',
    type: 'subtype',
    position: { x: 850, y: 400 },
    data: {
      label: 'ADMIN',
      attributes: [
        'access_level (سطح دسترسی)',
        'last_admin_action (آخرین اقدام)',
      ],
      color: 'border-red-500',
    },
  },

  // ==================== LEFT COLUMN: PROFILE & SOCIAL ====================
  {
    id: 'profiles',
    type: 'entity',
    position: { x: 50, y: 50 },
    data: {
      label: 'PROFILE',
      attributes: [
        'PK: profile_id',
        'FK: user_id',
        'bio (بیوگرافی)',
        'cover_image (تصویر کاور)',
        'DERIVED: followers_count',
        'DERIVED: following_count',
      ],
      color: 'border-purple-600',
      isWeak: true,
    },
  },
  {
    id: 'profile-interests',
    type: 'multivalued',
    position: { x: 50, y: 270 },
    data: { label: 'interests' },
  },
  {
    id: 'follows',
    type: 'relationship',
    position: { x: 320, y: 120 },
    data: {
      label: 'FOLLOWS',
      attributes: ['created_at'],
    },
  },

  // ==================== CENTER COLUMN: CONTENT (POSTS → PLACES → CITIES) ====================
  {
    id: 'posts',
    type: 'entity',
    position: { x: 50, y: 550 },
    data: {
      label: 'POSTS',
      attributes: [
        'PK: post_id',
        'FK: user_id',
        'FK: place_id',
        'FK: city_id',
        'title (عنوان)',
        'content (متن تجربه)',
        'experience_type (visited/imagined)',
        'created_at (تاریخ ثبت)',
        'approval_status (وضعیت تأیید)',
      ],
      color: 'border-green-600',
    },
  },
  {
    id: 'post-images',
    type: 'multivalued',
    position: { x: 50, y: 820 },
    data: { label: 'images' },
  },
  {
    id: 'post-rating',
    type: 'derived',
    position: { x: 180, y: 820 },
    data: { label: 'avg_rating' },
  },
  {
    id: 'ratings',
    type: 'relationship',
    position: { x: 320, y: 600 },
    data: {
      label: 'RATES',
      attributes: ['score (1-5)', 'created_at'],
    },
  },
  {
    id: 'comments',
    type: 'entity',
    position: { x: 50, y: 920 },
    data: {
      label: 'COMMENTS',
      attributes: [
        'PK: comment_id',
        'FK: post_id',
        'FK: user_id',
        'content (متن نظر)',
        'created_at',
      ],
      color: 'border-cyan-600',
      isWeak: true,
    },
  },

  // ==================== CENTER-RIGHT: LOCATION (PLACES & CITIES) ====================
  {
    id: 'places',
    type: 'entity',
    position: { x: 500, y: 600 },
    data: {
      label: 'PLACES',
      attributes: [
        'PK: place_id',
        'FK: city_id',
        'name (نام مکان)',
        'description (توضیحات)',
        'latitude (عرض جغرافیایی)',
        'longitude (طول جغرافیایی)',
        'map_url (نقشه)',
      ],
      color: 'border-orange-600',
    },
  },
  {
    id: 'place-features',
    type: 'multivalued',
    position: { x: 450, y: 820 },
    data: { label: 'features' },
  },
  {
    id: 'place-images',
    type: 'multivalued',
    position: { x: 580, y: 820 },
    data: { label: 'images' },
  },
  {
    id: 'cities',
    type: 'entity',
    position: { x: 780, y: 600 },
    data: {
      label: 'CITIES',
      attributes: [
        'PK: city_id',
        'name (نام شهر)',
        'description (توضیحات)',
        'province (استان)',
        'country (کشور)',
        'latitude',
        'longitude',
      ],
      color: 'border-teal-600',
    },
  },

  // ==================== RIGHT COLUMN: COMPANION FEATURES ====================
  {
    id: 'companion_requests',
    type: 'entity',
    position: { x: 1050, y: 50 },
    data: {
      label: 'COMPANION_REQUEST',
      attributes: [
        'PK: request_id',
        'FK: user_id',
        'FK: destination_place_id',
        'FK: destination_city_id',
        'travel_date (تاریخ سفر)',
        'description (توضیحات)',
        'status (active/completed/cancelled)',
        'created_at',
      ],
      color: 'border-pink-600',
    },
  },
  {
    id: 'travel-conditions',
    type: 'multivalued',
    position: { x: 1300, y: 100 },
    data: { label: 'conditions' },
  },
  {
    id: 'companion_matches',
    type: 'entity',
    position: { x: 1050, y: 350 },
    data: {
      label: 'COMPANION_MATCH',
      attributes: [
        'PK: match_id',
        'FK: request_id',
        'FK: companion_user_id',
        'status (pending/accepted/rejected)',
        'message (پیام)',
        'created_at',
      ],
      color: 'border-rose-600',
    },
  },
];

// EER Diagram Edges
const initialEdges: Edge[] = [
  // User to Specialization
  {
    id: 'e-users-spec',
    source: 'users',
    target: 'user-specialization',
    type: 'smoothstep',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  // Specialization to Subtypes
  {
    id: 'e-spec-regular',
    source: 'user-specialization',
    target: 'regular-user',
    type: 'smoothstep',
    style: { stroke: '#0ea5e9', strokeWidth: 2 },
  },
  {
    id: 'e-spec-moderator',
    source: 'user-specialization',
    target: 'moderator',
    type: 'smoothstep',
    style: { stroke: '#f59e0b', strokeWidth: 2 },
  },
  {
    id: 'e-spec-admin',
    source: 'user-specialization',
    target: 'admin',
    type: 'smoothstep',
    style: { stroke: '#ef4444', strokeWidth: 2 },
  },

  // User to Profile (1:1 Total Participation)
  {
    id: 'e-users-profiles',
    source: 'users',
    target: 'profiles',
    label: '1:1 (Total)',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#9333ea', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },

  // Profile to Multi-valued
  {
    id: 'e-profile-interests',
    source: 'profiles',
    target: 'profile-interests',
    type: 'straight',
    style: { stroke: '#a855f7', strokeDasharray: '5,5' },
  },

  // User to Follows (M:N Recursive)
  {
    id: 'e-users-follows',
    source: 'users',
    target: 'follows',
    label: 'follower (N)',
    type: 'smoothstep',
    style: { stroke: '#6366f1', strokeWidth: 2 },
  },
  {
    id: 'e-follows-users',
    source: 'follows',
    target: 'users',
    label: 'following (M)',
    type: 'smoothstep',
    style: { stroke: '#6366f1', strokeWidth: 2 },
  },

  // User to Posts (1:N)
  {
    id: 'e-users-posts',
    source: 'users',
    target: 'posts',
    label: '1:N',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#22c55e', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },

  // Post Multi-valued attributes
  {
    id: 'e-post-images',
    source: 'posts',
    target: 'post-images',
    type: 'straight',
    style: { stroke: '#22c55e', strokeDasharray: '5,5' },
  },
  {
    id: 'e-post-rating',
    source: 'posts',
    target: 'post-rating',
    type: 'straight',
    style: { stroke: '#22c55e', strokeDasharray: '3,3' },
  },

  // Posts to Places (N:1)
  {
    id: 'e-posts-places',
    source: 'posts',
    target: 'places',
    label: 'N:1',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#f97316', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },

  // Places to Cities (N:1)
  {
    id: 'e-places-cities',
    source: 'places',
    target: 'cities',
    label: 'N:1 (belongs to)',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#14b8a6', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },

  // Place Multi-valued
  {
    id: 'e-place-features',
    source: 'places',
    target: 'place-features',
    type: 'straight',
    style: { stroke: '#f97316', strokeDasharray: '5,5' },
  },
  {
    id: 'e-place-images',
    source: 'places',
    target: 'place-images',
    type: 'straight',
    style: { stroke: '#f97316', strokeDasharray: '5,5' },
  },

  // User to Companion Requests (1:N)
  {
    id: 'e-users-requests',
    source: 'users',
    target: 'companion_requests',
    label: '1:N',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#ec4899', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },

  // Request Multi-valued
  {
    id: 'e-request-conditions',
    source: 'companion_requests',
    target: 'travel-conditions',
    type: 'straight',
    style: { stroke: '#ec4899', strokeDasharray: '5,5' },
  },

  // Companion Requests to Matches (1:N)
  {
    id: 'e-requests-matches',
    source: 'companion_requests',
    target: 'companion_matches',
    label: '1:N',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#f43f5e', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },

  // User to Companion Matches (1:N)
  {
    id: 'e-users-matches',
    source: 'users',
    target: 'companion_matches',
    label: '1:N (as companion)',
    type: 'smoothstep',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },

  // Posts to Comments (1:N)
  {
    id: 'e-posts-comments',
    source: 'posts',
    target: 'comments',
    label: '1:N',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#06b6d4', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },

  // User to Ratings (M:N with Post)
  {
    id: 'e-users-ratings',
    source: 'users',
    target: 'ratings',
    label: 'N',
    type: 'smoothstep',
    style: { stroke: '#3b82f6', strokeWidth: 2 },
  },
  {
    id: 'e-ratings-posts',
    source: 'ratings',
    target: 'posts',
    label: 'M',
    type: 'smoothstep',
    style: { stroke: '#22c55e', strokeWidth: 2 },
  },

  // Requests to Places/Cities
  {
    id: 'e-requests-places',
    source: 'companion_requests',
    target: 'places',
    label: 'destination',
    type: 'smoothstep',
    style: { stroke: '#f97316', strokeWidth: 1 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e-requests-cities',
    source: 'companion_requests',
    target: 'cities',
    label: 'destination',
    type: 'smoothstep',
    style: { stroke: '#14b8a6', strokeWidth: 1 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },

  // User to Comments (1:N) - Users can write comments
  {
    id: 'e-users-comments',
    source: 'users',
    target: 'comments',
    label: '1:N',
    type: 'smoothstep',
    style: { stroke: '#06b6d4', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },

  // Posts to Cities (N:1) - Posts can be about a city
  {
    id: 'e-posts-cities',
    source: 'posts',
    target: 'cities',
    label: 'N:1',
    type: 'smoothstep',
    style: { stroke: '#14b8a6', strokeWidth: 1, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
];

const EERDiagram: React.FC = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-screen bg-gray-50" dir="ltr">
      <div className="p-4 bg-white border-b shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">
          EER Diagram - همسفر میرزا (Hamsafar Mirza)
        </h1>
        <p className="text-gray-600 mt-1">
          Enhanced Entity-Relationship Diagram with Specialization/Generalization
        </p>
        <div className="flex gap-4 mt-3 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">E</div>
            <span>Entity (Rectangle)</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-4 bg-yellow-100 border-2 border-yellow-600"
              style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
            ></div>
            <span>Relationship (Diamond)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span>Primary Key (PK)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>Foreign Key (FK)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>Derived Attribute</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full border-4 border-double border-purple-500 text-xs">O</span>
            <span>Multi-valued</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 border-2 border-gray-800 rounded-full flex items-center justify-center text-xs font-bold">d</span>
            <span>Disjoint Specialization</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 border-4 border-double border-gray-400 text-xs">W</span>
            <span>Weak Entity</span>
          </div>
        </div>
      </div>
      <div style={{ height: 'calc(100vh - 150px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.3}
          maxZoom={2}
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const colors: Record<string, string> = {
                users: '#2563eb',
                profiles: '#9333ea',
                posts: '#16a34a',
                places: '#ea580c',
                cities: '#0d9488',
                companion_requests: '#db2777',
                follows: '#fbbf24',
                companion_matches: '#f43f5e',
                'regular-user': '#0ea5e9',
                moderator: '#f59e0b',
                admin: '#ef4444',
                comments: '#06b6d4',
                ratings: '#fbbf24',
              };
              return colors[node.id] || '#64748b';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default EERDiagram;
