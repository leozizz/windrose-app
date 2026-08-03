import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client/react';
import { ActivityType, ActivityRankingResult } from '@windrose/shared-types';

const RANK_ACTIVITY_QUERY = gql`
  query RankActivity($cityName: String!, $activity: ActivityType!) {
    rankActivity(cityName: $cityName, activity: $activity) {
      locationName
      latitude
      longitude
      activity
      overallScore
      recommendationLevel
      dailyScores {
        date
        score
        recommendationLevel
        reasons
      }
    }
  }
`;

export function App() {
  const [cityNameInput, setCityNameInput] = useState<string>('Florianópolis');
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>(
    ActivityType.OUTDOOR_SIGHTSEEING
  );

  const [executeSearch, { loading, error, data }] = useLazyQuery<{
    rankActivity: ActivityRankingResult;
  }>(RANK_ACTIVITY_QUERY, {
    fetchPolicy: 'network-only',
  });

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cityNameInput.trim()) return;

    executeSearch({
      variables: {
        cityName: cityNameInput.trim(),
        activity: selectedActivity,
      },
    });
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedActivity]);

  const ranking: ActivityRankingResult | undefined = data?.rankActivity;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', {
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
        <h1 className="app-title">Windrose</h1>
        <p className="app-subtitle">
          7-Day Weather Suitability Ranking for Travel & Activities
        </p>
      </header>

      <section className="search-card">
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group">
            <label className="form-label">Target Destination</label>
            <div className="input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Enter city name (e.g. Florianópolis, Honolulu, Aspen, Lisbon)..."
                value={cityNameInput}
                onChange={(e) => setCityNameInput(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Activity</label>
            <div className="activity-selector">
              <button
                type="button"
                className={`activity-tab ${
                  selectedActivity === ActivityType.OUTDOOR_SIGHTSEEING ? 'active' : ''
                }`}
                onClick={() => setSelectedActivity(ActivityType.OUTDOOR_SIGHTSEEING)}
              >
                🌲 Outdoor Sightseeing
              </button>
              <button
                type="button"
                className={`activity-tab ${
                  selectedActivity === ActivityType.SURFING ? 'active' : ''
                }`}
                onClick={() => setSelectedActivity(ActivityType.SURFING)}
              >
                🏄‍♂️ Surfing
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="search-button"
            disabled={loading || !cityNameInput.trim()}
          >
            {loading ? 'Analyzing Weather...' : 'Rank Destination'}
          </button>
        </form>
      </section>

      {error && (
        <div className="error-banner">
          ⚠️ {error.message || 'Unable to retrieve weather ranking. Please verify the city name.'}
        </div>
      )}

      {loading && !ranking && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Retrieving forecast & calculating activity suitability...
          </p>
        </div>
      )}

      {ranking && (
        <>
          <section className="hero-result-card">
            <div>
              <h2 className="hero-info-title">{ranking.locationName}</h2>
              <div className="hero-info-subtitle">
                <span>
                  {ranking.activity === ActivityType.OUTDOOR_SIGHTSEEING
                    ? 'Outdoor Sightseeing'
                    : 'Surfing'}
                </span>
                <span>•</span>
                <span className={`recommendation-tag badge-${ranking.recommendationLevel}`}>
                  {ranking.recommendationLevel}
                </span>
              </div>
            </div>

            <div className={`hero-score-badge badge-${ranking.recommendationLevel}`}>
              <span className="hero-score-value">{ranking.overallScore}</span>
              <span className="hero-score-label">7-Day Score</span>
            </div>
          </section>

          <section>
            <h3 className="section-title">7-Day Detailed Breakdown</h3>
            <div className="forecast-grid">
              {ranking.dailyScores.map((day, idx) => (
                <div key={idx} className="day-card">
                  <div className="day-header">
                    <span className="day-date">{formatDate(day.date)}</span>
                    <span className={`day-score-pill badge-${day.recommendationLevel}`}>
                      {day.score} / 100
                    </span>
                  </div>

                  <ul className="reasons-list">
                    {day.reasons.map((reason, rIdx) => (
                      <li key={rIdx} className="reason-item">
                        <span className="reason-bullet">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default App;
