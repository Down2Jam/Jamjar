import { Card } from "@/framework/Card";
import Icon from "@/framework/Icon";
import { Link } from "@/framework/Link";
import { Hstack, Vstack } from "@/framework/Stack";
import Text from "@/framework/Text";

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
