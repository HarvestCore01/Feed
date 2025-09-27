// === leaderboard.js ===
export function getLeaderboard() {
  let users = JSON.parse(localStorage.getItem("users") || "{}");
  let userArray = Object.entries(users).map(([username, data]) => ({
    username,
    feed: data.feed
  }));

  // Tri du plus grand feed au plus petit
  return userArray.sort((a, b) => b.feed - a.feed);
}

export function getUserRank(username) {
  const leaderboard = getLeaderboard();
  const index = leaderboard.findIndex(user => user.username === username);
  return index === -1 ? null : index + 1;
}

export function getNextDiff(username) {
  const leaderboard = getLeaderboard();
  const index = leaderboard.findIndex(user => user.username === username);

  if (index > 0) {
    const userFeed = leaderboard[index].feed;
    const aboveFeed = leaderboard[index - 1].feed;
    return aboveFeed - userFeed;
  }
  return 0;
}
