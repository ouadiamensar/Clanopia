import { useState, useRef, useEffect } from 'react';

const TeamSelector = ({ UserTeams, navigate, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    setIsOpen(false);
  };

  const handleGoToTeam = () => {
    if (selectedTeam) {
      navigate(`/team/${selectedTeam.teamId}/workspace/channel/general-chat`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          px-3 py-1.5 pr-8
          rounded-xl
          text-sm font-medium
          border-2 border-cyan-500/50
          bg-gradient-to-br from-blue-600/20 via-cyan-600/20 to-blue-600/20
          backdrop-blur-xl
          text-white
          focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50
          transition-all duration-300
          cursor-pointer
          min-w-[140px]
          truncate
          relative
          hover:border-cyan-400
        `}
      >
        <span className="flex items-center justify-between">
          <span>
            {selectedTeam ? (
              <>
                <span className="mr-2">🏢</span>
                {selectedTeam.name || "Unnamed Team"}
              </>
            ) : (
              <span className="text-gray-400">
                🏢 {t("rightSidebar.selectTeam") || "Select Team"}
              </span>
            )}
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          className={`
            absolute top-full left-0 right-0 mt-2
            rounded-xl
            border-2 border-cyan-500/50
            bg-gradient-to-br from-blue-600/30 via-cyan-600/30 to-blue-600/30
            backdrop-blur-xl
            shadow-2xl
            overflow-hidden
            z-50
            min-w-[200px]
            max-h-[300px]
            overflow-y-auto
          `}
        >
          {!selectedTeam && (
            <div
              className={`
                px-4 py-2.5
                text-sm text-gray-400
                border-b border-cyan-500/20
                cursor-default
              `}
            >
               {t("rightSidebar.selectTeam") || "Select Team"}
            </div>
          )}

          {UserTeams.map((team) => (
            <div
              key={team.teamId}
              onClick={() => handleTeamSelect(team)}
              className={`
                px-4 py-2.5
                text-sm font-medium
                text-white
                hover:bg-cyan-500/20
                cursor-pointer
                transition-all duration-200
                flex items-center justify-between
                ${selectedTeam?.teamId === team.teamId ? 'bg-cyan-500/30' : ''}
                border-b border-cyan-500/10 last:border-b-0
              `}
            >
              <span className="truncate">
                {team.name || "Unnamed Team"}
              </span>
              {selectedTeam?.teamId === team.teamId && (
                <svg
                  className="w-4 h-4 text-cyan-400 flex-shrink-0 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedTeam && (
        <button
          onClick={handleGoToTeam}
          className={`
            mt-2
            w-full
            px-4 py-2
            rounded-xl
            text-sm font-semibold
            bg-gradient-to-r from-cyan-500 to-blue-500
            hover:from-cyan-400 hover:to-blue-400
            text-white
            shadow-lg shadow-cyan-500/30
            hover:shadow-cyan-500/50
            transition-all duration-300
            transform hover:scale-[1.02]
            focus:outline-none focus:ring-2 focus:ring-cyan-400/50
          `}
        >
           {t("rightSidebar.goToTeam") || "Go to Team"}
        </button>
      )}
    </div>
  );
};

export default TeamSelector;