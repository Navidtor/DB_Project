import React, { useCallback } from 'react';
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

// Custom Entity Node Component
const EntityNode = ({ data }: { data: { label: string; attributes: string[]; color: string } }) => {
  return (
    <div className={`rounded-lg shadow-lg border-2 ${data.color} bg-white min-w-[200px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className={`px-4 py-2 font-bold text-white rounded-t-md ${data.color.replace('border-', 'bg-')}`}>
        {data.label}
      </div>
      <div className="p-3 space-y-1">
        {data.attributes.map((attr, index) => (
          <div key={index} className="text-sm text-gray-700 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${attr.startsWith('🔑') ? 'bg-yellow-500' : attr.startsWith('🔗') ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
            {attr}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

const nodeTypes = {
  entity: EntityNode,
};

// Define entities based on the Persian document
const initialNodes: Node[] = [
  {
    id: 'users',
    type: 'entity',
    position: { x: 400, y: 50 },
    data: {
      label: '👤 Users (کاربران)',
      attributes: [
        '🔑 user_id (PK)',
        'name (نام)',
        'username (نام کاربری)',
        'email (ایمیل)',
        'phone (شماره تماس)',
        'password_hash (رمزعبور)',
        'profile_image (تصویر پروفایل)',
        'role (نقش: user/moderator/admin)',
        'created_at (تاریخ ایجاد)',
      ],
      color: 'border-blue-600',
    },
  },
  {
    id: 'profiles',
    type: 'entity',
    position: { x: 50, y: 50 },
    data: {
      label: '📋 Profiles (صفحه شخصی)',
      attributes: [
        '🔑 profile_id (PK)',
        '🔗 user_id (FK)',
        'bio (بیوگرافی)',
        'cover_image (تصویر کاور)',
        'followers_count',
        'following_count',
      ],
      color: 'border-purple-600',
    },
  },
  {
    id: 'posts',
    type: 'entity',
    position: { x: 400, y: 350 },
    data: {
      label: '📝 Posts (پست‌ها)',
      attributes: [
        '🔑 post_id (PK)',
        '🔗 user_id (FK)',
        '🔗 place_id (FK)',
        '🔗 city_id (FK)',
        'title (عنوان)',
        'content (متن تجربه)',
        'status (visited/imagined)',
        'created_at (تاریخ ثبت)',
        'images (تصاویر)',
      ],
      color: 'border-green-600',
    },
  },
  {
    id: 'places',
    type: 'entity',
    position: { x: 50, y: 350 },
    data: {
      label: '📍 Places (مکان‌ها)',
      attributes: [
        '🔑 place_id (PK)',
        '🔗 city_id (FK)',
        'name (نام مکان)',
        'description (توضیحات)',
        'features (ویژگی‌ها)',
        'images (تصاویر)',
        'map_url (نقشه)',
        'latitude (عرض جغرافیایی)',
        'longitude (طول جغرافیایی)',
      ],
      color: 'border-orange-600',
    },
  },
  {
    id: 'cities',
    type: 'entity',
    position: { x: 50, y: 650 },
    data: {
      label: '🏙️ Cities (شهرها)',
      attributes: [
        '🔑 city_id (PK)',
        'name (نام شهر)',
        'description (توضیحات)',
        'province (استان)',
        'country (کشور)',
        'image (تصویر)',
        'latitude',
        'longitude',
      ],
      color: 'border-teal-600',
    },
  },
  {
    id: 'companion_requests',
    type: 'entity',
    position: { x: 750, y: 350 },
    data: {
      label: '🤝 Companion Requests (درخواست همسفر)',
      attributes: [
        '🔑 request_id (PK)',
        '🔗 user_id (FK)',
        '🔗 destination_place_id (FK)',
        '🔗 destination_city_id (FK)',
        'travel_date (تاریخ سفر)',
        'description (توضیحات)',
        'conditions (شرایط سفر)',
        'status (active/completed/cancelled)',
        'created_at',
      ],
      color: 'border-pink-600',
    },
  },
  {
    id: 'follows',
    type: 'entity',
    position: { x: 750, y: 50 },
    data: {
      label: '👥 Follows (دنبال‌کردن)',
      attributes: [
        '🔑 follow_id (PK)',
        '🔗 follower_id (FK → Users)',
        '🔗 following_id (FK → Users)',
        'created_at',
      ],
      color: 'border-indigo-600',
    },
  },
  {
    id: 'companion_matches',
    type: 'entity',
    position: { x: 750, y: 650 },
    data: {
      label: '✅ Companion Matches (تطابق همسفر)',
      attributes: [
        '🔑 match_id (PK)',
        '🔗 request_id (FK)',
        '🔗 companion_user_id (FK)',
        'status (pending/accepted/rejected)',
        'message (پیام)',
        'created_at',
      ],
      color: 'border-red-600',
    },
  },
];

// Define relationships
const initialEdges: Edge[] = [
  {
    id: 'e-users-profiles',
    source: 'users',
    target: 'profiles',
    label: '1:1',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#6366f1' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e-users-posts',
    source: 'users',
    target: 'posts',
    label: '1:N (یک کاربر چند پست)',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#22c55e' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e-users-requests',
    source: 'users',
    target: 'companion_requests',
    label: '1:N',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#ec4899' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e-users-follows',
    source: 'users',
    target: 'follows',
    label: '1:N',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#6366f1' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e-places-posts',
    source: 'places',
    target: 'posts',
    label: '1:N',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#f97316' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e-cities-places',
    source: 'cities',
    target: 'places',
    label: '1:N (یک شهر چند مکان)',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#14b8a6' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e-cities-posts',
    source: 'cities',
    target: 'posts',
    label: '1:N',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#14b8a6' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e-places-requests',
    source: 'places',
    target: 'companion_requests',
    label: '1:N',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#f97316' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e-cities-requests',
    source: 'cities',
    target: 'companion_requests',
    label: '1:N',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#14b8a6' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e-requests-matches',
    source: 'companion_requests',
    target: 'companion_matches',
    label: '1:N',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#ef4444' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: 'e-users-matches',
    source: 'users',
    target: 'companion_matches',
    label: '1:N',
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#3b82f6' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
];

const ERDiagram: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-screen bg-gray-50" dir="ltr">
      <div className="p-4 bg-white border-b shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">
          📊 ER Diagram - همسفر میرزا (Hamsafar Mirza)
        </h1>
        <p className="text-gray-600 mt-1">
          Entity-Relationship Diagram for Travel Social Platform
        </p>
        <div className="flex gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-sm">Primary Key (PK)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-sm">Foreign Key (FK)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span className="text-sm">Attribute</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">1:N = One to Many</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">1:1 = One to One</span>
          </div>
        </div>
      </div>
      <div style={{ height: 'calc(100vh - 130px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
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
                follows: '#4f46e5',
                companion_matches: '#dc2626',
              };
              return colors[node.id] || '#64748b';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default ERDiagram;
