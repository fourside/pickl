import type { Story } from "@ladle/react";
import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router";
import { ListDetailPage } from "./page";

export default {
  title: "list-detail/page",
};

function DetailRoute({ listId }: { listId: string }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(`/lists/${listId}`, { replace: true });
  }, [navigate, listId]);
  return (
    <Routes>
      <Route path="/lists/:id" element={<ListDetailPage />} />
    </Routes>
  );
}

export const Participant: Story = () => <DetailRoute listId="list-1" />;

export const NonParticipant: Story = () => <DetailRoute listId="list-2" />;
