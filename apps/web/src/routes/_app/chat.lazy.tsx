import { useChat } from "@ai-sdk/react";
import {
	AiChat02Icon,
	ArrowUp01Icon,
	StopIcon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/organisms/page-header";
import { Page, PageBody } from "@/components/templates/page";
import { Button } from "@/components/ui/button";
import {
	ChatContainerContent,
	ChatContainerRoot,
	ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import { Loader } from "@/components/ui/loader";
import { Message, MessageContent } from "@/components/ui/message";
import {
	PromptInput,
	PromptInputAction,
	PromptInputActions,
	PromptInputTextarea,
} from "@/components/ui/prompt-input";

export const Route = createLazyFileRoute("/_app/chat")({
	component: ChatPage,
});

const SUGGESTED_PROMPTS = [
	"What is the revenue for FY25-26?",
	"How many staff are at attrition risk?",
	"Show me the hiring pipeline",
	"What are the salary brackets for Tax?",
];

function ChatPage() {
	const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
		useChat({ api: "/api/chat" });

	const lastMessage = messages[messages.length - 1];
	const showLoader = isLoading && lastMessage?.role === "user";

	const handleSuggestionClick = (prompt: string) => {
		handleInputChange({
			target: { value: prompt },
		} as React.ChangeEvent<HTMLTextAreaElement>);
		setTimeout(() => {
			handleSubmit();
		}, 0);
	};

	return (
		<Page>
			<PageHeader />

			<PageBody className="flex flex-col overflow-hidden">
				{/* Message list */}
				<ChatContainerRoot className="flex-1 px-4 py-4">
					<ChatContainerContent className="mx-auto w-full max-w-3xl gap-4">
						{messages.length === 0 && (
							<div className="flex min-h-[300px] flex-col items-center justify-center gap-6 py-12">
								<div className="flex flex-col items-center gap-2 text-center">
									<HugeiconsIcon
										icon={AiChat02Icon}
										className="size-10 text-text-soft-400"
									/>
									<p className="text-sm text-text-soft-400">
										Ask me about revenue, headcount, hiring, and more.
									</p>
								</div>
								<div className="flex flex-wrap justify-center gap-2">
									{SUGGESTED_PROMPTS.map((prompt) => (
										<Button
											key={prompt}
											variant="outline"
											size="sm"
											onClick={() => handleSuggestionClick(prompt)}
											className="text-xs"
										>
											{prompt}
										</Button>
									))}
								</div>
							</div>
						)}

						{messages
							.filter((m) => m.role === "user" || m.role === "assistant")
							.map((message) => (
								<Message
									key={message.id}
									className={
										message.role === "user" ? "flex-row-reverse" : undefined
									}
								>
									<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-weak-50">
										<HugeiconsIcon
											icon={
												message.role === "assistant" ? AiChat02Icon : UserIcon
											}
											className="size-4 text-text-soft-400"
										/>
									</div>
									<MessageContent
										markdown={message.role === "assistant"}
										className={
											message.role === "user"
												? "bg-primary text-primary-foreground"
												: undefined
										}
									>
										{message.content}
									</MessageContent>
								</Message>
							))}

						{showLoader && (
							<Message>
								<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-weak-50">
									<HugeiconsIcon
										icon={AiChat02Icon}
										className="size-4 text-text-soft-400"
									/>
								</div>
								<div className="rounded-lg bg-secondary p-3">
									<Loader variant="typing" size="sm" />
								</div>
							</Message>
						)}

						<ChatContainerScrollAnchor />
					</ChatContainerContent>
				</ChatContainerRoot>

				{/* Input bar */}
				<div className="shrink-0 border-stroke-soft-200 border-t px-4 py-4">
					<div className="mx-auto max-w-3xl">
						<PromptInput
							value={input}
							onValueChange={(val) =>
								handleInputChange({
									target: { value: val },
								} as React.ChangeEvent<HTMLTextAreaElement>)
							}
							onSubmit={handleSubmit}
							isLoading={isLoading}
						>
							<PromptInputTextarea placeholder="Ask about revenue, headcount, hiring…" />
							<PromptInputActions className="justify-end px-1 pb-1">
								{isLoading ? (
									<PromptInputAction tooltip="Stop">
										<Button
											size="icon-sm"
											variant="ghost"
											onClick={stop}
											aria-label="Stop"
										>
											<HugeiconsIcon icon={StopIcon} className="size-4" />
										</Button>
									</PromptInputAction>
								) : (
									<PromptInputAction tooltip="Send">
										<Button
											size="icon-sm"
											disabled={!input.trim() || isLoading}
											onClick={() => handleSubmit()}
											aria-label="Send"
										>
											<HugeiconsIcon icon={ArrowUp01Icon} className="size-4" />
										</Button>
									</PromptInputAction>
								)}
							</PromptInputActions>
						</PromptInput>
					</div>
				</div>
			</PageBody>
		</Page>
	);
}
