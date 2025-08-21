"use client";

import { Button } from "@/framework/Button";
import { Card } from "@/framework/Card";
import { Vstack } from "@/framework/Stack";
import { handleApplication, handleInvite } from "@/helpers/team";
import { getSelf } from "@/requests/user";
import { UserType } from "@/types/UserType";
import { useEffect, useState } from "react";

export default function InboxPage() {
  const [user, setUser] = useState<UserType>();

  useEffect(() => {
    async function fetchData() {
      try {
        const self = await getSelf();
        const data = await self.json();
        setUser(data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-3 text-[#333] dark:text-white">
      <p>Invites</p>
      {user?.teamInvites.length || 0 > 0 ? (
        <div className="flex flex-col gap-3">
          {user?.teamInvites.map((invite) => (
            <Card key={invite.id}>
              <Vstack>
                <p>{invite.team.owner.name}&apos;s Team</p>
                <p>{invite.content}</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      handleInvite(invite.id, true);
                    }}
                    icon="check"
                  >
                    Accept
                  </Button>
                  <Button
                    onClick={() => {
                      handleInvite(invite.id, false);
                    }}
                    icon="x"
                  >
                    Reject
                  </Button>
                </div>
              </Vstack>
            </Card>
          ))}
        </div>
      ) : (
        <p>None</p>
      )}
      <p>Applications</p>
      {user?.ownedTeams.filter((team) => team.applications.length > 0).length ||
      0 > 0 ? (
        <div className="flex flex-col gap-3">
          {user?.ownedTeams.map((team) =>
            team.applications.map((application) => (
              <Card key={application.id}>
                <Vstack>
                  <p>{application.user.name}</p>
                  <p>{application.content}</p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        handleApplication(application.id, true);
                      }}
                      icon="check"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => {
                        handleApplication(application.id, false);
                      }}
                      icon="x"
                    >
                      Reject
                    </Button>
                  </div>
                </Vstack>
              </Card>
            ))
          )}
        </div>
      ) : (
        <p>None</p>
      )}
    </div>
  );
}
