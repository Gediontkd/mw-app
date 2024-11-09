import React, { useState } from 'react';

const TournamentPlayers = ({ players, FIXED_PLAYER_SLOTS }) => {
  const [showNames, setShowNames] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Each slide shows 4 players
  const totalSlides = Math.ceil(FIXED_PLAYER_SLOTS.length / 4);
  const currentPlayers = FIXED_PLAYER_SLOTS.slice(currentSlide * 4, (currentSlide + 1) * 4);

  return (
    <div className="w-full">
      {/* Navigation Bar */}
      <div className="flex justify-between items-center bg-black p-4 rounded-t-lg border-[1px] border-[#8a2be2]">
        <div 
          className="cursor-pointer text-white font-bold"
          onClick={() => setShowNames(!showNames)}
        >
          Click to expand
        </div>
        <div className="flex gap-2">
          <div className="text-white font-bold">PLAYERS</div>
          <div className="text-[#8a2be2] font-bold">TEAMS</div>
        </div>
      </div>

      {/* Players Grid */}
      <div className="bg-[#1a1a1a] p-6 rounded-b-lg border-x-[1px] border-b-[1px] border-[#8a2be2]">
        <div className="grid grid-cols-4 gap-4">
          {currentPlayers.map((slot) => (
            <div key={slot.id} className="relative">
              <div className="aspect-[3/4] bg-[#2a2a2a] rounded-lg overflow-hidden">
                <img
                  src={slot.image}
                  alt={slot.position}
                  className="w-full h-full object-cover"
                />
              </div>
              {showNames && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-2 text-white text-center">
                  {players.find(p => p.id === slot.id)?.name || slot.position}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Slide Navigation Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full ${
                currentSlide === index ? 'bg-[#8a2be2]' : 'bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TournamentPlayers;