import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityType,
  ActivityRankingResult,
  PointOfInterest,
} from '@windrose/shared-types';
import { apiClient } from '../services/api.client';
import { useTripSession } from '../hooks/useTripSession';
import { SwipeDeck } from '../components/SwipeDeck';
import { MatchesList } from '../components/MatchesList';

type ActiveTab = 'weather' | 'swipe' | 'matches';

export function App() {
  const [cityNameInput, setCityNameInput] = useState<string>('Florianópolis');
  const [activeCity, setActiveCity] = useState<string>('Florianópolis');
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>(
    ActivityType.OUTDOOR_SIGHTSEEING
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('swipe');

  // Weather state
  const [ranking, setRanking] = useState<ActivityRankingResult | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Places Deck state
  const [places, setPlaces] = useState<PointOfInterest[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // Trip Session Hook (LocalStorage Stateless Storage)
  const session = useTripSession(activeCity);

  const fetchData = useCallback(
    async (city: string, activity: ActivityType) => {
      setLoadingWeather(true);
      setWeatherError(null);
      setLoadingPlaces(true);
      setPlacesError(null);

      try {
        const rankingResult = await apiClient.getRanking(city, activity);
        setRanking(rankingResult);
        setActiveCity(rankingResult.locationName);

        // Fetch POIs using exact coordinates from ranking
        try {
          const deckResult = await apiClient.getPlacesDeck(
            rankingResult.locationName,
            rankingResult.latitude,
            rankingResult.longitude,
            25
          );
          setPlaces(deckResult.deck);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar lugares.';
          setPlacesError(msg);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível consultar o clima.';
        setWeatherError(msg);
      } finally {
        setLoadingWeather(false);
        setLoadingPlaces(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData('Florianópolis', selectedActivity);
  }, [fetchData, selectedActivity]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cityNameInput.trim()) return;
    fetchData(cityNameInput.trim(), selectedActivity);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container">
      <header className="app-header">
        <div className="logo-container">
          <span className="app-badge-tag">Edge Edition • 100% Gratuito</span>
          <h1 className="app-title">Windrose</h1>
          <p className="app-subtitle">
            Planejador Inteligente: Clima, Atividades & Descoberta Estilo Tinder
          </p>
        </div>
      </header>

      {/* Search & Configuration Bar */}
      <section className="search-card">
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group flex-1">
            <label className="form-label" htmlFor="city-input">
              Destino
            </label>
            <div className="input-wrapper">
              <input
                id="city-input"
                type="text"
                className="search-input"
                placeholder="Digite a cidade (ex: Florianópolis, Honolulu, Aspen, Lisboa)..."
                value={cityNameInput}
                onChange={(e) => setCityNameInput(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Perfil de Atividade</label>
            <div className="activity-selector">
              <button
                type="button"
                className={`activity-tab ${
                  selectedActivity === ActivityType.OUTDOOR_SIGHTSEEING ? 'active' : ''
                }`}
                onClick={() => setSelectedActivity(ActivityType.OUTDOOR_SIGHTSEEING)}
              >
                🌲 Passeio ao Ar Livre
              </button>
              <button
                type="button"
                className={`activity-tab ${
                  selectedActivity === ActivityType.SURFING ? 'active' : ''
                }`}
                onClick={() => setSelectedActivity(ActivityType.SURFING)}
              >
                🏄‍♂️ Surf & Praia
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="search-button"
            disabled={loadingWeather || !cityNameInput.trim()}
          >
            {loadingWeather ? 'Analisando...' : 'Explorar'}
          </button>
        </form>
      </section>

      {weatherError && (
        <div className="error-banner">
          ⚠️ {weatherError}
        </div>
      )}

      {/* Destination Summary & Mode Navigation Tabs */}
      {ranking && (
        <nav className="mode-tabs-nav" aria-label="Navegação de Modos">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'swipe' ? 'active' : ''}`}
            onClick={() => setActiveTab('swipe')}
          >
            🎴 Explorar Lugares (Swipe)
            {places.length > 0 && <span className="tab-pill">{places.length}</span>}
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            ❤️ Meus Matches
            {session.totalLikes > 0 && (
              <span className="tab-pill pill-match">{session.totalLikes}</span>
            )}
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'weather' ? 'active' : ''}`}
            onClick={() => setActiveTab('weather')}
          >
            ⛅ Previsão do Clima ({ranking.overallScore}/100)
          </button>
        </nav>
      )}

      {/* Main Tab Views */}
      <main className="tab-content-area">
        {activeTab === 'swipe' && (
          <div className="swipe-view-wrapper">
            {loadingPlaces ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Preparando deck de atrações, bares e restaurantes...</p>
              </div>
            ) : placesError ? (
              <div className="error-banner">⚠️ {placesError}</div>
            ) : (
              <SwipeDeck
                places={places}
                isSwiped={session.isSwiped}
                onSwipe={session.swipe}
                onUndo={session.undo}
                canUndo={session.canUndo}
                onViewMatches={() => setActiveTab('matches')}
                totalLikes={session.totalLikes}
              />
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <MatchesList
            city={activeCity}
            matches={session.likedPois}
            onBackToSwipe={() => setActiveTab('swipe')}
            onClearMatches={session.clearSession}
          />
        )}

        {activeTab === 'weather' && ranking && (
          <div className="weather-view-wrapper">
            <section className="hero-result-card">
              <div>
                <h2 className="hero-info-title">{ranking.locationName}</h2>
                <div className="hero-info-subtitle">
                  <span>
                    {ranking.activity === ActivityType.OUTDOOR_SIGHTSEEING
                      ? 'Passeio ao Ar Livre'
                      : 'Surf & Praia'}
                  </span>
                  <span>•</span>
                  <span>
                    Coord: {ranking.latitude.toFixed(2)}°, {ranking.longitude.toFixed(2)}°
                  </span>
                </div>
              </div>

              <div className="hero-score-badge">
                <span className="score-number">{ranking.overallScore}</span>
                <span className="score-max">/100</span>
                <span
                  className={`recommendation-tag ${
                    ranking.recommendationLevel === 'EXCELLENT'
                      ? 'tag-excellent'
                      : ranking.recommendationLevel === 'GOOD'
                      ? 'tag-good'
                      : ranking.recommendationLevel === 'FAIR'
                      ? 'tag-fair'
                      : 'tag-poor'
                  }`}
                >
                  {ranking.recommendationLevel}
                </span>
              </div>
            </section>

            <h3 className="section-title">Previsão e Viabilidade para os Próximos 7 Dias</h3>
            <div className="days-grid">
              {ranking.dailyScores.map((day) => (
                <div key={day.date} className="day-card">
                  <div className="day-header">
                    <span className="day-date">{formatDate(day.date)}</span>
                    <span
                      className={`day-score-pill ${
                        day.score >= 80
                          ? 'pill-excellent'
                          : day.score >= 60
                          ? 'pill-good'
                          : day.score >= 40
                          ? 'pill-fair'
                          : 'pill-poor'
                      }`}
                    >
                      {day.score} pts
                    </span>
                  </div>

                  <ul className="reasons-list">
                    {day.reasons.map((reason, idx) => (
                      <li key={idx} className="reason-item">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Windrose App • Dados meteorológicos fornecidos por{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>{' '}
          & POIs por{' '}
          <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>{' '}
          / Wikimedia.
        </p>
      </footer>
    </div>
  );
}

export default App;
