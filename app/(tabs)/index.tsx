import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
const API_KEY = '9b0ebffd'; 
const API_URL = 'https://www.omdbapi.com/';
const HomeScreen = ({ navigation }: any) => {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    loadFavorites();
  }, []);
  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };
  const searchMovies = async (newPage = 1) => {
    if (!query) return;
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: { s: query, page: newPage, apiKey: API_KEY }
      });
      if (response.data.Response === 'True') {
        setMovies(
          newPage === 1
            ? response.data.Search ?? []
            : [...movies, ...(response.data.Search ?? [])]
        );
        setPage(newPage);
      } else {
        setMovies([]);
        Alert.alert('No movies found', 'Try searching for something else.');
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
    setLoading(false);
  };
  const loadMoreMovies = () => {
    if (!loading) searchMovies(page + 1);
  };
  const toggleFavorite = async (movieId: string) => {
    const updatedFavorites = favorites.includes(movieId)
      ? favorites.filter(id => id !== movieId)
      : [...favorites, movieId];

    setFavorites(updatedFavorites);
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for a movie..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => searchMovies()}
      />
      {loading && <ActivityIndicator size="large" />}
      <FlatList
        data={movies}
        keyExtractor={item => item.imdbID}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.movieItem}
            onPress={() => navigation.navigate('Details', { movieId: item.imdbID })}
          >
            <Image
              source={{
                uri:
                  item.Poster !== 'N/A'
                    ? item.Poster
                    : 'https://via.placeholder.com/50x75'
              }}
              style={styles.poster}
            />
            <View style={styles.movieInfo}>
              <Text style={styles.movieTitle}>
                {item.Title} ({item.Year})
              </Text>
              <TouchableOpacity onPress={() => toggleFavorite(item.imdbID)}>
                <Text style={styles.favoriteButton}>
                  {favorites.includes(item.imdbID) ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        onEndReached={loadMoreMovies}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
};
const DetailsScreen = ({ route }: any) => {
  const { movieId } = route.params;
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await axios.get(API_URL, {
          params: { i: movieId, apiKey: API_KEY }
        });
        if (response.data.Response === 'True') {
          setMovie(response.data);
        }
      } catch (error) {
        console.error('Error fetching movie details:', error);
      }
      setLoading(false);
    };
    fetchMovieDetails();
  }, [movieId]);

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={{
          uri:
            movie?.Poster !== 'N/A'
              ? movie?.Poster
              : 'https://via.placeholder.com/200x300'
        }}
        style={styles.detailPoster}
      />
      <Text style={styles.movieTitle}>
        {movie?.Title} ({movie?.Year})
      </Text>
      <Text>Genre: {movie?.Genre}</Text>
      <Text>Rating: {movie?.imdbRating}</Text>
      <Text>{movie?.Plot}</Text>
    </SafeAreaView>
  );
};
const Stack = createStackNavigator();
function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Search Movies" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5'
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 5
  },
  movieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 5,
    borderRadius: 5
  },
  poster: {
    width: 50,
    height: 75,
    marginRight: 10,
    borderRadius: 5
  },
  movieInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  favoriteButton: {
    fontSize: 20,
    color: 'gold'
  },
  detailPoster: {
    width: 200,
    height: 300,
    alignSelf: 'center',
    marginBottom: 10,
    borderRadius: 10
  }
});
registerRootComponent(App);
