
import asyncio
import os
from dotenv import load_dotenv 
load_dotenv()
from browser_use import Agent, Browser, ChatBrowserUse
from browser_use import ChatGoogle  # ChatGoogle(model='gemini-3-flash-preview')
# from browser_use import ChatAnthropic  # ChatAnthropic(model='claude-sonnet-4-6')
import asyncio

async def main():
    browser = Browser(
        # use_cloud=True,  # Use a stealth browser on Browser Use Cloud
    )

    agent = Agent(
        task="Open the Cốc Cốc browser and access the Gemini website. Choose to log in using the account lean80469@gmail.com",
        # llm=ChatBrowserUse(),
        llm=ChatGoogle(model='gemini-3-flash-preview'), 
        # llm=ChatAnthropic(model='claude-sonnet-4-6'),
        browser=browser,
    )
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())