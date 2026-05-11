import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SendEmailViaDomainInput {
  @Field(() => String)
  emailingDomainId: string;

  @Field(() => [String])
  to: string[];

  @Field(() => [String], { nullable: true })
  cc?: string[];

  @Field(() => [String], { nullable: true })
  bcc?: string[];

  @Field(() => String)
  subject: string;

  @Field(() => String)
  text: string;

  @Field(() => String, { nullable: true })
  html?: string;

  @Field(() => String, { nullable: true })
  from?: string;

  @Field(() => [String], { nullable: true })
  replyTo?: string[];
}
