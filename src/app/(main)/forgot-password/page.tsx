import { Card } from "bioloom-ui";
import { Icon } from "bioloom-ui";
import { Link } from "bioloom-ui";
import { Hstack, Vstack } from "bioloom-ui";
import { Text } from "bioloom-ui";

export default function ForgotPage() {
  return (
    <Vstack>
      <Card>
        <Vstack>
          <Hstack>
            <Icon name="circlehelp" />
            <Text size="xl">Forgot password</Text>
          </Hstack>
          <Text size="sm" color="textFaded">
            Resetting your account password
          </Text>
        </Vstack>
      </Card>
      <Card className="max-w-96">
        <Text color="textFaded">
          The automatic password reset system is still being set up. To get your
          password manually reset contact Ategon on our{" "}
          <Link href="https://discord.d2jam.com">discord server</Link> (ping in
          a channel or dm with context)
        </Text>
      </Card>
    </Vstack>
  );
}
