import axios from "axios";
import { MoodResult, Track } from "@/types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export async function analyzeMood(text: string): Promise<MoodResult> {
  const { data } = await api.post<MoodResult>("/mood/analyze", { text });
  return data;
}

export async function submitQuestionnaire(
  answers: string[]
): Promise<MoodResult> {
  const { data } = await api.post<MoodResult>("/mood/questionnaire", {
    answers,
  });
  return data;
}

export async function getTimeMood(): Promise<MoodResult> {
  const { data } = await api.get<MoodResult>("/mood/time");
  return data;
}

export async function getTracks(mood?: string): Promise<Track[]> {
  const { data } = await api.get<Track[]>("/tracks", {
    params: {
      ...(mood ? { mood } : {}),
      _t: Date.now(), // cache-bust so each request gets fresh shuffle
    },
  });
  return data;
}

export async function searchTracks(
  query: string,
  mood?: string
): Promise<Track[]> {
  const { data } = await api.get<Track[]>("/tracks/search", {
    params: {
      q: query,
      ...(mood ? { mood } : {}),
    },
  });
  return data;
}
