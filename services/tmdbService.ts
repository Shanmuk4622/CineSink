import { Movie } from '../types';

// In a real app, use process.env.REACT_APP_TMDB_API_KEY
const MOCK_DELAY = 500;

export const fetchTrendingMovies = async (): Promise<Movie[]> => {
  // Simulating an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          title: "Dune: Part Two",
          poster_path: "https://picsum.photos/300/450?random=1",
          overview: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
          vote_average: 8.5,
          release_date: "2024-02-27"
        },
        {
          id: 2,
          title: "Oppenheimer",
          poster_path: "https://picsum.photos/300/450?random=2",
          overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
          vote_average: 8.1,
          release_date: "2023-07-19"
        },
        {
          id: 3,
          title: "Salaar: Part 1 - Ceasefire",
          poster_path: "https://picsum.photos/300/450?random=3",
          overview: "A gang leader tries to keep a promise made to his dying friend and takes on the other criminal gangs.",
          vote_average: 7.2,
          release_date: "2023-12-22"
        },
        {
          id: 4,
          title: "Leo",
          poster_path: "https://picsum.photos/300/450?random=4",
          overview: "Parthiban is a mild-mannered cafe owner in Kashmir, who fends off a gang of murderous thugs and gains attention from a drug cartel.",
          vote_average: 7.5,
          release_date: "2023-10-18"
        },
        {
          id: 5,
          title: "The Bear (Season 3)",
          poster_path: "https://picsum.photos/300/450?random=5",
          overview: "Carmy pushes himself harder than ever and demands excellence from his crew, who do their best to match his intensity.",
          vote_average: 8.9,
          release_date: "2024-06-26"
        }
      ]);
    }, MOCK_DELAY);
  });
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
        // Just return a mock list filtered by name for demo purposes
        resolve([
            {
                id: 101,
                title: `${query} : The Movie`,
                poster_path: "https://picsum.photos/300/450?random=10",
                overview: "A generated search result for demonstration.",
                vote_average: 6.5,
                release_date: "2024-01-01"
            }
        ]);
    }, MOCK_DELAY);
  });
};