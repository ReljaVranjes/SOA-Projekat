import React, { useState, useEffect } from "react";
import followersService, {
  User,
  RecommendationUser,
  PopularUser,
} from "../services/followersService";
import { useAuth } from "../contexts/AuthContext";

const FollowUsers: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "recommendations" | "popular" | "following" | "followers" | "all"
  >("recommendations");
  const [recommendations, setRecommendations] = useState<RecommendationUser[]>(
    []
  );
  const [popularUsers, setPopularUsers] = useState<PopularUser[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case "recommendations":
          await loadRecommendations();
          break;
        case "popular":
          await loadPopularUsers();
          break;
        case "following":
          await loadFollowing();
          break;
        case "followers":
          await loadFollowers();
          break;
        case "all":
          await loadAllUsers();
          break;
      }

      await loadFollowingSet();
    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    const data = await followersService.getRecommendations(20);
    setRecommendations(data);
  };

  const loadPopularUsers = async () => {
    const data = await followersService.getPopularUsers(20);
    setPopularUsers(data);
  };

  const loadFollowing = async () => {
    const data = await followersService.getMyFollowing();
    setFollowing(data);
  };

  const loadFollowers = async () => {
    const data = await followersService.getMyFollowers();
    setFollowers(data);
  };

  const loadAllUsers = async () => {
    const data = await followersService.getAllUsers();
    // Filter out the current user
    const filteredUsers = data.filter((u) => u.id !== user?.id);
    setAllUsers(filteredUsers);
  };

  const loadFollowingSet = async () => {
    try {
      const followingIds = await followersService.getFollowedUserIds();
      setFollowingSet(new Set(followingIds));
    } catch (err) {
      console.error("Error loading following set:", err);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const result = await followersService.followUser(userId);
      if (result.success) {
        setFollowingSet((prev) => new Set(Array.from(prev).concat(userId)));
        await loadData();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to follow user. Please try again.");
      console.error("Error following user:", err);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      const result = await followersService.unfollowUser(userId);
      if (result.success) {
        setFollowingSet((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        await loadData();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to unfollow user. Please try again.");
      console.error("Error unfollowing user:", err);
    }
  };

  const UserCard: React.FC<{
    user: User | RecommendationUser | PopularUser;
  }> = ({ user }) => {
    const isFollowing = followingSet.has(user.id);
    const isRecommendation = "reason" in user;
    const isPopular = "followerCount" in user;

    return (
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">{user.username}</h3>
            <p className="text-sm text-gray-500">{user.role}</p>
          </div>
          <div className="flex items-center space-x-2">
            {isPopular && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {user.followerCount} followers
              </span>
            )}
            <span
              className={`text-xs px-2 py-1 rounded ${
                user.role === "Admin"
                  ? "bg-red-100 text-red-800"
                  : user.role === "Guide"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {user.role}
            </span>
          </div>
        </div>

        {isRecommendation && (
          <p className="text-xs text-gray-600 mb-3">
            {user.reason}
            {user.mutualConnections > 0 &&
              ` (${user.mutualConnections} mutual connections)`}
          </p>
        )}

        <button
          onClick={() =>
            isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)
          }
          className={`w-full py-2 px-4 rounded transition-colors ${
            isFollowing
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isFollowing ? "Unfollow" : "Follow"}
        </button>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    let users: (User | RecommendationUser | PopularUser)[] = [];

    switch (activeTab) {
      case "recommendations":
        users = recommendations;
        break;
      case "popular":
        users = popularUsers;
        break;
      case "following":
        users = following;
        break;
      case "followers":
        users = followers;
        break;
      case "all":
        users = allUsers;
        break;
    }

    if (users.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No users found.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Follow Users</h1>
        <p className="text-gray-600">
          Connect with other users and discover new content
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: "recommendations", label: "Recommendations" },
            { key: "popular", label: "Popular Users" },
            { key: "all", label: "All Users" },
            { key: "following", label: "Following" },
            { key: "followers", label: "Followers" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {renderContent()}
    </div>
  );
};

export default FollowUsers;
