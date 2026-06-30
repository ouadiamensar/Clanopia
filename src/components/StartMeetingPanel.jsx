import React from "react";

const StartMeetingPanel = ({ meeting, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-8 rounded-xl w-96 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
          onClick={onClose}
        >
          ✖
        </button>
        <h2 className="text-2xl font-bold mb-4">{meeting.title || "New Meeting"}</h2>
        <p className="mb-2">
          <strong>Status:</strong>{" "}
          <span className={meeting.status === "Now" ? "text-green-400" : "text-yellow-400"}>
            {meeting.status}
          </span>
        </p>
        {meeting.link && (
          <p className="mb-2">
            <strong>Link:</strong>{" "}
            <a href={meeting.link} target="_blank" className="text-blue-400 underline">
              {meeting.link}
            </a>
          </p>
        )}
        {meeting.info && (
          <p className="mb-2">
            <strong>Info:</strong> {meeting.info}
          </p>
        )}
        <button
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default StartMeetingPanel;
