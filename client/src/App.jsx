import { useMemo } from "react";
import { FTUE_KEY, SPLASH_MS, gameTips } from "./constants/appConstants.js";
import { BackButton, BottomNav, GameTipToast, Header, SplashScreen } from "./components/AppChrome.jsx";
import FtueScreen from "./screens/FtueScreen.jsx";
import { HomeScreen, PlayHubScreen } from "./screens/HomeScreen.jsx";
import { RewardsScreen, StoryMatchScreen, StoryScreen } from "./screens/ProgressionScreens.jsx";
import { MiniGameScreen, ProfileScreen, ReviewScreen, ShopScreen, TrainingScreen } from "./screens/MetaScreens.jsx";
import OnlineScreen from "./screens/OnlineScreen.jsx";
import { useAppNavigation } from "./hooks/useAppNavigation.js";
import { useSplashScreen } from "./hooks/useSplashScreen.js";
import { useTransientTip } from "./hooks/useTransientTip.js";
import { usePlayerProgress } from "./hooks/usePlayerProgress.js";

export default function App() {
  const showSplash = useSplashScreen(SPLASH_MS);
  const { activeTip, showNextTip } = useTransientTip(gameTips, 3000);
  const initialRoute = localStorage.getItem(FTUE_KEY) ? "home" : "ftue";
  const { route, navigateTo, goBack, resetNavigation } = useAppNavigation(initialRoute);
  const {
    profile,
    storyProgress,
    ownedMoves,
    activeStoryMatch,
    claimDaily,
    claimLevelReward,
    buyMove,
    watchAdReward,
    selectAvatar,
    recordMatch,
    startStoryMatch,
    addStoryWin,
    finishFtue,
    setActiveStoryMatch
  } = usePlayerProgress({ navigateTo });

  const screens = useMemo(() => ({
    home: <HomeScreen profile={profile} onNavigate={navigateTo} onWatchAd={watchAdReward} />,
    play: <PlayHubScreen onNavigate={navigateTo} />,
    rewards: <RewardsScreen profile={profile} onClaimDaily={claimDaily} onClaimLevelReward={claimLevelReward} />,
    story: <StoryScreen profile={profile} progress={storyProgress} onPlayMatch={startStoryMatch} />,
    "story-match": activeStoryMatch ? (
      <StoryMatchScreen
        profile={profile}
        activeMatch={activeStoryMatch}
        onComplete={addStoryWin}
        onReturnHome={() => {
          setActiveStoryMatch(null);
          navigateTo("home", { replace: true });
        }}
        onRecordMatch={recordMatch}
        ownedMoves={ownedMoves}
        onDoubleReward={(amount) => watchAdReward("coins", amount)}
      />
    ) : <PlayHubScreen onNavigate={navigateTo} />,
    training: <TrainingScreen ownedMoves={ownedMoves} onBuyMove={buyMove} />,
    minigames: <MiniGameScreen />,
    online: <OnlineScreen profile={profile} onRecordMatch={recordMatch} ownedMoves={ownedMoves} onDoubleReward={(amount) => watchAdReward("coins", amount)} onReturnHome={() => navigateTo("home", { replace: true })} onBack={goBack} />,
    review: <ReviewScreen profile={profile} />,
    profile: <ProfileScreen profile={profile} onSelectAvatar={selectAvatar} />,
    shop: <ShopScreen profile={profile} ownedMoves={ownedMoves} onBuyMove={buyMove} />,
    ftue: <FtueScreen onComplete={(nextProfile) => finishFtue(nextProfile, resetNavigation)} />
  }), [
    activeStoryMatch,
    addStoryWin,
    buyMove,
    claimDaily,
    claimLevelReward,
    finishFtue,
    goBack,
    navigateTo,
    ownedMoves,
    profile,
    recordMatch,
    resetNavigation,
    selectAvatar,
    startStoryMatch,
    storyProgress,
    watchAdReward
  ]);

  const shellHiddenRoutes = ["story-match", "online"];
  const showShell = route !== "ftue" && !shellHiddenRoutes.includes(route);
  const showHeader = showShell && !["profile", "review"].includes(route);

  if (showSplash) return <SplashScreen />;

  return (
    <div className={`app-shell ${route === "home" ? "home-shell" : ""}`}>
      {route === "ftue" ? (
        screens.ftue
      ) : showShell ? (
        <>
          {showHeader ? <Header profile={profile} onOpenProfile={() => navigateTo("profile")} onOpenReview={() => navigateTo("review")} onOpenTips={showNextTip} /> : null}
          {route !== "home" ? <BackButton onBack={goBack} /> : null}
          <GameTipToast tip={activeTip} />
          {screens[route] || screens.home}
          <BottomNav route={route === "shop" ? "shop" : "home"} onNavigate={navigateTo} />
        </>
      ) : (
        screens[route] || screens.home
      )}
    </div>
  );
}
