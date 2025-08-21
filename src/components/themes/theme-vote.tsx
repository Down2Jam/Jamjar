"use client";

import { getCookie } from "@/helpers/cookie";
import {
  ActiveJamResponse,
  getCurrentJam,
  hasJoinedCurrentJam,
  joinJam,
} from "@/helpers/jam";
import { ThemeType } from "@/types/ThemeType";
import { Card, CardBody, Spinner } from "@heroui/react";
import { Vote } from "lucide-react";
import { useEffect, useState } from "react";
import { getThemes, postThemeVotingVote } from "@/requests/theme";
import { Button } from "@/framework/Button";

export default function VotingPage() {
  const [themes, setThemes] = useState<ThemeType[]>([]);
  const [activeJamResponse, setActiveJam] = useState<ActiveJamResponse | null>(
    null
  );
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState<boolean>(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const activeJam = await getCurrentJam();
        setActiveJam(activeJam); // Set active jam details

        const joined = await hasJoinedCurrentJam();
        setHasJoined(joined);
      } catch (error) {
        console.error("Error fetching current jam:", error);
      }

      try {
        const response = await getThemes(true);
        if (response.ok) {
          const data = await response.json();

          const votedThemes = data.data
            .filter(
              (theme: ThemeType) => theme.votes2 && theme.votes2.length > 0
            )
            .sort(
              (a: ThemeType, b: ThemeType) =>
                (a.votes2 ? new Date(a.votes2[0].updatedAt).getTime() : 0) -
                (b.votes2 ? new Date(b.votes2[0].updatedAt).getTime() : 0)
            );

          const nonVotedThemes = data.data
            .filter(
              (theme: ThemeType) => !theme.votes2 || theme.votes2.length === 0
            )
            .sort(() => Math.random() - 0.5); // Shuffle

          setThemes([...votedThemes, ...nonVotedThemes]);
        } else {
          console.error("Error fetching themes");
        }
      } catch (error) {
        console.error("Error fetching random theme:", error);
      } finally {
        setPhaseLoading(false);
      }
    }

    fetchData();
  }, []);

  function voteSkip(index: number) {
    const newThemes = [...themes];
    newThemes[index] = {
      ...newThemes[index],
      votes2: [
        {
          voteScore: 0,
          voteRound: 1,
          id: 0,
          themeSuggestionId: newThemes[index].id,
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    setThemes(newThemes);

    try {
      postThemeVotingVote(themes[index].id, 0);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  }

  function voteLike(index: number) {
    const newThemes = [...themes];
    newThemes[index] = {
      ...newThemes[index],
      votes2: [
        {
          voteScore: 1,
          voteRound: 1,
          id: 0,
          themeSuggestionId: newThemes[index].id,
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    setThemes(newThemes);

    try {
      postThemeVotingVote(themes[index].id, 1);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  }

  function voteStar(index: number) {
    const newThemes = [...themes];
    newThemes[index] = {
      ...newThemes[index],
      votes2: [
        {
          voteScore: 3,
          voteRound: 1,
          id: 0,
          themeSuggestionId: newThemes[index].id,
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    setThemes(newThemes);

    try {
      postThemeVotingVote(themes[index].id, 3);
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  }

  const token = getCookie("token");

  if (phaseLoading) {
    return (
      <div className="text-[#333] dark:text-white flex items-center flex-col gap-4 py-20">
        <p>Loading</p>
        <Spinner />
      </div>
    );
  } else if (!token) {
    return (
      <div className="text-[#333] dark:text-white">
        Sign in to be able to vote on themes
      </div>
    );
  } else if (!hasJoined) {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Join the Jam First
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          You need to join the current jam before you can eliminate themes.
        </p>
        <button
          onClick={() => {
            if (activeJamResponse?.jam?.id !== undefined) {
              joinJam(activeJamResponse.jam.id);
            }
          }}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Join Jam
        </button>
      </div>
    );
  } else if (activeJamResponse?.phase !== "Voting") {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Not in Theme Voting Phase
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          The current phase is{" "}
          <strong>{activeJamResponse?.phase || "Unknown"}</strong>. Please come
          back during the Theme Voting phase.
        </p>
      </div>
    );
  } else if (
    activeJamResponse &&
    activeJamResponse.jam &&
    new Date(activeJamResponse.jam.startTime).getTime() -
      new Date().getTime() <=
      60 * 60 * 1000
  ) {
    return (
      <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Not in Theme Voting Phase
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Theme will be revealed on jam start.
        </p>
      </div>
    );
  } else {
    return (
      <div className="text-[#333] dark:text-white flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Vote />
          <p className="text-2xl">Theme Voting</p>
        </div>
        <p>
          Welcome to the Theme Voting! You can vote on the current top 15 themes
          to show which ones you enjoy. The top voted theme after taking into
          account everybody&apos;s votes will be the theme of the jam.
        </p>
        <p>
          You can vote on as many themes as you want. Likes add +1 to the
          theme&apos;s score while stars (that you can give 2 of) give +3 to a
          theme&apos;s score.
        </p>

        <div className="p-4">
          <div className="flex flex-col gap-2">
            {themes ? (
              themes.map((theme, i) => (
                <div key={theme.id}>
                  <Card className={`border border-transparent w-full`}>
                    <CardBody className="py-2">
                      <div className="flex justify-between items-center">
                        <p>
                          <span className="text-xs text-gray-500">
                            {String(i + 1).padStart(2, "0")}
                          </span>{" "}
                          {theme.suggestion}
                        </p>
                        <div className="items-center flex gap-3">
                          <Button
                            size="sm"
                            // tooltip="Skip"
                            onClick={() => {
                              voteSkip(i);
                            }}
                            // important={
                            //   themes[i].votes2 &&
                            //   themes[i].votes2.length > 0 &&
                            //   themes[i].votes2[0].voteScore == 0
                            // }
                          >
                            0
                          </Button>
                          <Button
                            color="green"
                            size="sm"
                            // tooltip="Like (+1)"
                            onClick={() => {
                              voteLike(i);
                            }}
                            // important={
                            //   themes[i].votes2 &&
                            //   themes[i].votes2.length > 0 &&
                            //   themes[i].votes2[0].voteScore == 1
                            // }
                          >
                            1
                          </Button>
                          <Button
                            color="yellow"
                            size="sm"
                            // tooltip="Star (+3)"
                            icon="star"
                            onClick={() => {
                              voteStar(i);
                            }}
                            // important={
                            //   themes[i].votes2 &&
                            //   themes[i].votes2.length > 0 &&
                            //   themes[i].votes2[0].voteScore == 3
                            // }
                            disabled={
                              themes.reduce(
                                (prev, curr) =>
                                  prev +
                                  (curr.votes2 &&
                                  curr.votes2.length > 0 &&
                                  curr.votes2[0].voteScore == 3
                                    ? 1
                                    : 0),
                                0
                              ) >= 2 &&
                              !(
                                themes[i].votes2 &&
                                themes[i].votes2.length > 0 &&
                                themes[i].votes2[0].voteScore == 3
                              )
                            }
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              ))
            ) : (
              <>No themes were found</>
            )}
          </div>
        </div>
      </div>
    );
  }
}

// "use client";

// import React, { useState, useEffect } from "react";
// import { getCookie } from "@/helpers/cookie";
// import {
//   getCurrentJam,
//   hasJoinedCurrentJam,
//   ActiveJamResponse,
// } from "@/helpers/jam";
// import { ThemeType } from "@/types/ThemeType";
// import { joinJam } from "@/helpers/jam";
// import {
//   getThemeVotes,
//   getTopThemes,
//   postThemeSuggestionVote,
// } from "@/requests/theme";

// interface VoteType {
//   themeSuggestionId: number;
//   // votingScore: number;
// }

// export default function VotingPage() {
//   const [themes, setThemes] = useState<ThemeType[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [activeJamResponse, setActiveJamResponse] =
//     useState<ActiveJamResponse | null>(null);
//   const [hasJoined, setHasJoined] = useState<boolean>(false);
//   const [phaseLoading, setPhaseLoading] = useState(true); // Loading state for fetching phase
//   const token = getCookie("token");

//   // Fetch the current jam phase using helpers/jam
//   useEffect(() => {
//     const fetchCurrentJamPhase = async () => {
//       try {
//         const activeJam = await getCurrentJam();
//         setActiveJamResponse(activeJam); // Set active jam details
//       } catch (error) {
//         console.error("Error fetching current jam:", error);
//       } finally {
//         setPhaseLoading(false); // Stop loading when phase is fetched
//       }
//     };

//     fetchCurrentJamPhase();
//   }, []);

//   // Fetch themes only when phase is "Voting"
//   useEffect(() => {
//     // Fetch top N themes with voting scores
//     async function fetchThemes() {
//       if (!token || !activeJamResponse) return;

//       try {
//         const response = await getTopThemes();
//         if (response.ok) {
//           const themes = await response.json();

//           // Fetch user's votes for these themes
//           const votesResponse = await getThemeVotes();

//           if (votesResponse.ok) {
//             const votes = await votesResponse.json();
//             // Merge themes with user's votes
//             const themesWithVotes = themes.map((theme: ThemeType) => {
//               const vote = votes.find(
//                 (v: VoteType) => v.themeSuggestionId === theme.id
//               );
//               return {
//                 ...theme,
//                 votingScore: vote ? vote.votingScore : null,
//               };
//             });
//             setThemes(themesWithVotes);
//           }
//         } else {
//           console.error("Failed to fetch themes.");
//         }
//       } catch (error) {
//         console.error("Error fetching themes:", error);
//       }
//     }

//     if (activeJamResponse?.phase === "Voting") {
//       fetchThemes();
//     }
//   }, [activeJamResponse, token]);

//   // Handle voting
//   const handleVote = async (themeId: number, votingScore: number) => {
//     setThemes((prevThemes) =>
//       prevThemes.map((theme) =>
//         theme.id === themeId ? { ...theme, loading: true } : theme
//       )
//     );

//     try {
//       const response = await postThemeSuggestionVote(themeId, votingScore);

//       if (response.ok) {
//         setThemes((prevThemes) =>
//           prevThemes.map((theme) =>
//             theme.id === themeId
//               ? { ...theme, votingScore, loading: false }
//               : theme
//           )
//         );
//       } else {
//         console.error("Failed to submit vote.");
//         setThemes((prevThemes) =>
//           prevThemes.map((theme) =>
//             theme.id === themeId ? { ...theme, loading: false } : theme
//           )
//         );
//       }
//     } catch (error) {
//       console.error("Error submitting vote:", error);
//       setThemes((prevThemes) =>
//         prevThemes.map((theme) =>
//           theme.id === themeId ? { ...theme, loading: false } : theme
//         )
//       );
//     }
//   };

//   useEffect(() => {
//     const init = async () => {
//       const joined = await hasJoinedCurrentJam();
//       setHasJoined(joined);
//       setLoading(false);
//     };

//     init();
//   }, []);

//   if (phaseLoading || loading) {
//     return <div>Loading...</div>;
//   }

//   if (activeJamResponse?.phase !== "Voting") {
//     return (
//       <div className="p-4 bg-gray-100 dark:bg-gray-800 min-h-screen">
//         <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
//           Not in Voting Phase
//         </h1>
//         <p className="text-gray-600 dark:text-gray-400">
//           The current phase is{" "}
//           <strong>{activeJamResponse?.phase || "Unknown"}</strong>. Please come
//           back during the Voting phase.
//         </p>
//       </div>
//     );
//   }

//   const loggedIn = getCookie("token");

//   if (!loggedIn) {
//     return <div>Sign in to be able to vote</div>;
//   }

//   if (!hasJoined) {
//     return (
//       <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
//         <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
//           Join the Jam First
//         </h1>
//         <p className="text-gray-600 dark:text-gray-400">
//           You need to join the current jam before you can vote themes.
//         </p>
//         <button
//           onClick={() => {
//             if (activeJamResponse?.jam?.id !== undefined) {
//               joinJam(activeJamResponse.jam.id);
//             }
//           }}
//           className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//         >
//           Join Jam
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="p-3 bg-gray-100 dark:bg-gray-800 min-h-screen">
//       <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
//         Voting Phase
//       </h1>
//       <div className="space-y-2">
//         {themes.map((theme) => (
//           <div
//             key={theme.id}
//             className="p-3 bg-white dark:bg-gray-900 rounded-lg shadow-md flex items-center"
//           >
//             {/* Voting Buttons */}
//             <div className="flex gap-1 mr-4">
//               <button
//                 onClick={() => handleVote(theme.id, -1)}
//                 className={`px-3 py-2 rounded-lg ${
//                   theme.votingScore === -1
//                     ? "bg-red-500 text-white"
//                     : "bg-gray-300 text-black hover:bg-red-500 hover:text-white"
//                 }`}
//                 disabled={loading}
//               >
//                 -1
//               </button>
//               <button
//                 onClick={() => handleVote(theme.id, 0)}
//                 className={`px-3 py-2 rounded-lg ${
//                   theme.votingScore === 0
//                     ? "bg-gray-500 text-white"
//                     : "bg-gray-300 text-black hover:bg-gray-500 hover:text-white"
//                 }`}
//                 disabled={loading}
//               >
//                 0
//               </button>
//               <button
//                 onClick={() => handleVote(theme.id, +1)}
//                 className={`px-3 py-2 rounded-lg ${
//                   theme.votingScore === +1
//                     ? "bg-green-500 text-white"
//                     : "bg-gray-300 text-black hover:bg-green-500 hover:text-white"
//                 }`}
//                 disabled={loading}
//               >
//                 +1
//               </button>
//             </div>

//             {/* Theme Suggestion */}
//             <div className="text-gray-800 dark:text-white">
//               {theme.suggestion}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
