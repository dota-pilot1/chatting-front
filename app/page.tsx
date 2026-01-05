"use client";

import { useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

type ConnectionStatus =
  | "DISCONNECTED"
  | "CONNECTED"
  | "WAITING"
  | "MATCHED"
  | "IN_ROOM";

export default function Home() {
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("DISCONNECTED");
  const [waitingCount, setWaitingCount] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [messages, setMessages] = useState<
    { nickname: string; message: string }[]
  >([]);
  const [inputMessage, setInputMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);

  const handleConnect = () => {
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요");
      return;
    }

    const socket = io("http://localhost:3010");
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("CONNECTED");
    });

    socket.on("disconnect", () => {
      setStatus("DISCONNECTED");
    });

    socket.on("statusChange", (data: { status: ConnectionStatus }) => {
      setStatus(data.status);
    });

    socket.on("waitingCount", (data: { count: number }) => {
      setWaitingCount(data.count);
    });

    socket.on("matched", () => {
      setStatus("MATCHED");
    });

    socket.on(
      "joinedRoom",
      (data: { roomId: string; participants: string[] }) => {
        setStatus("IN_ROOM");
        setRoomId(data.roomId);
        setParticipants(data.participants);
      },
    );

    socket.on("newMessage", (data: { nickname: string; message: string }) => {
      setMessages((prev) => [...prev, data]);
    });
  };

  const handleDisconnect = () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setStatus("DISCONNECTED");
  };

  const handleJoinQueue = () => {
    socketRef.current?.emit("joinQueue", { nickname });
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      socketRef.current?.emit("sendMessage", {
        message: inputMessage,
        nickname,
      });
      setInputMessage("");
    }
  };

  const getStatusColor = (s: ConnectionStatus) => {
    switch (s) {
      case "DISCONNECTED":
        return "text-red-500";
      case "CONNECTED":
        return "text-green-500";
      case "WAITING":
        return "text-yellow-500";
      case "MATCHED":
        return "text-purple-500";
      case "IN_ROOM":
        return "text-blue-500";
    }
  };

  const getStatusText = (s: ConnectionStatus) => {
    switch (s) {
      case "DISCONNECTED":
        return "연결 안됨";
      case "CONNECTED":
        return "연결됨";
      case "WAITING":
        return "대기중";
      case "MATCHED":
        return "매치됨";
      case "IN_ROOM":
        return "채팅방 입장";
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-8">
      {/* 1. 연결 컨트롤 영역 */}
      <section className="mb-8 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-4">연결 설정</h2>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="닉네임 입력"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            disabled={status !== "DISCONNECTED"}
            className="px-4 py-2 rounded bg-white border border-gray-300 text-black placeholder-gray-400 disabled:opacity-50"
          />
          {status === "DISCONNECTED" ? (
            <button
              onClick={handleConnect}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
            >
              연결
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
            >
              연결 해제
            </button>
          )}
        </div>
      </section>

      {/* 2. 상태 패널 */}
      <section className="p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-4">상태</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-600">내 상태:</span>
            <span className={`font-bold ${getStatusColor(status)}`}>
              {getStatusText(status)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600">대기 인원:</span>
            <span className="font-bold">{waitingCount}명</span>
          </div>
        </div>
      </section>

      {/* 3. 대기열 참가 버튼 */}
      <section className="mt-8">
        <button
          onClick={handleJoinQueue}
          disabled={status !== "CONNECTED"}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          대기열 참가
        </button>
      </section>

      {/* 4. 방 정보 (IN_ROOM 상태일 때만) */}
      {status === "IN_ROOM" && (
        <section className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-bold mb-4">방 정보</h2>
          <div className="space-y-2">
            <p>
              <span className="text-gray-600">방 ID:</span> {roomId}
            </p>
            <p>
              <span className="text-gray-600">참가자:</span>{" "}
              {participants.join(", ")}
            </p>
          </div>
        </section>
      )}

      {/* 5. 채팅 (IN_ROOM 상태일 때만) */}
      {status === "IN_ROOM" && (
        <section className="mt-8 p-6 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-bold mb-4">채팅</h2>
          <div className="h-60 overflow-y-auto bg-white border border-gray-300 rounded p-4 mb-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-2 ${msg.nickname === nickname ? "text-right" : "text-left"}`}
              >
                <span className="font-bold">{msg.nickname}:</span> {msg.message}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="메시지 입력"
              className="flex-1 px-4 py-2 rounded bg-white border border-gray-300 text-black placeholder-gray-400"
            />
            <button
              onClick={handleSendMessage}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              전송
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
