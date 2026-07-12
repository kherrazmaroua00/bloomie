import Navbar from "../components/Navbar";
import ToDoList from "../components/ToDoList";
import Tracker from "../components/Tracker";
import FocusTimer from "../components/FocusTimer";
import MoodTracker from "../components/MoodTracker";
import Diary from "../components/Diary";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-cream p-6">
      <Navbar />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-6">
          <ToDoList />
          <Tracker />
        </div>
        <FocusTimer />
        <div className="flex flex-col gap-6">
          <MoodTracker />
          <Diary />
        </div>
      </div>
    </div>
  );
}