import {GetStaticPaths, GetStaticProps} from 'next';
import {useRouter} from 'next/router';
import {useEffect, useRef, useState} from 'react';
import FullpageLoader from '../../../components/fullpage-loader';
import Layout from '../../../components/layout';
import ReportForm from '../../../components/report-form';
import VideoPlayer from '../../../components/video-player';
import {HOST_URL} from '../../../constants';
import logger from '../../../lib/logger';

type Params = {
	id: string;
};

export type Props = {
	playbackId: string;
	poster: string;
};

export const getStaticProps: GetStaticProps = async (context) => {
	const {params} = context;
	const {id: playbackId} = params as Params;
	const poster = `https://image.mux.com/${playbackId}/thumbnail.png`;
	const shareUrl = `${HOST_URL}/v/${playbackId}`;

	return {props: {playbackId, shareUrl, poster}};
};

export const getStaticPaths: GetStaticPaths = async () => {
	return {
		paths: [],
		fallback: true,
	};
};

const META_TITLE = 'Remotion Showcase Upload';
const Playback: React.FC<Props> = ({playbackId, poster}) => {
	const [isLoaded, setIsLoaded] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	const [size, setSize] =
		useState<null | {
			width: number;
			height: number;
		}>(null);
	const [openReport, setOpenReport] = useState(false);
	const copyTimeoutRef = useRef<number | null>(null);
	const router = useRouter();

	useEffect(() => {
		return () => {
			if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
		};
	}, []);

	if (router.isFallback) {
		return (
			<Layout metaTitle="View this video" image={poster} centered darkMode>
				<FullpageLoader text="Loading player..." />;
			</Layout>
		);
	}

	const onError = (evt: ErrorEvent) => {
		setErrorMessage('This video does not exist');
		setIsLoaded(false);
		logger.error('Error', evt);
	};

	const showLoading = !isLoaded && !errorMessage;

	const startTime =
		(router.query?.time && parseFloat(router.query.time as string)) || 0;

	const currentDate = new Date();
	const dateString = `${(currentDate.getMonth() + 1)
		.toString()
		.padStart(2, '0')}-${String(currentDate.getDate()).padStart(
		2,
		'0'
	)}-${currentDate.getFullYear()}`;

	return (
		<Layout
			metaTitle={META_TITLE}
			image={poster}
			centered={showLoading}
			darkMode
		>
			{errorMessage && <h1 className="error-message">{errorMessage}</h1>}
			{showLoading && <FullpageLoader text="Loading player" />}
			<div className="wrapper">
				{!openReport && (
					<VideoPlayer
						playbackId={playbackId}
						poster={poster}
						currentTime={startTime}
						onLoaded={() => setIsLoaded(true)}
						onError={onError}
						onSize={(s) => setSize(s)}
					/>
				)}
				<div
					style={{
						color: 'white',
					}}
				>
					<h2>Submit this video to the showcase</h2>
					<ol>
						<li>
							Click{' '}
							<a
								target="_blank"
								href="https://github.com/remotion-dev/remotion/blob/main/packages/docs/src/data/showcase-videos.tsx"
							>
								here
							</a>{' '}
							and then click the pen icon to edit the file.
						</li>
						<li>
							Add the following snippet to the <strong>end</strong> of the
							showcaseVideos array. We have already filled in the video ID and
							the dimensions.
						</li>
						<pre>
							{`
{
	title: "<enter title>",
	type: "mux_video",
	muxId: "${playbackId}",
	description: "Add a description here",
	height: ${size ? size.height : 'Loading, please wait...'},
	width: ${size ? size.width : 'Loading please wait...'},
	submittedOn: new Date("${dateString}"),
	links: [
		{
			type: "source_code",
			url: "<add github url or delete this object>",
		},
		{
			type: "video",
			url: "<add video link or delete this object>",
		},
		{
			type: "website",
			url: "<add product link or delete this object>",
		},
		{
			type: "tutorial",
			url: "<add link to tutorial or delete this object>",
		},
	],
	author: {
		"url": "<link your website or social media profile>",
		"name": "<Enter your name or organization>"
	}
},
						`}
						</pre>
						<li>
							Replace the placeholders in angle brackets with accurate
							description. Guidelines:
							<ul>
								<li>Title: Max 80 characters, no emoji, no all caps</li>
								<li>
									Description: Max 280 characters, use neutral language, focus
									on the Remotion usecase.
								</li>
								<li>Height, width and maxId: Should not be altered</li>
							</ul>
						</li>
						Our CI will validate these rules, so we cannot merge any submissions
						that fail these guidelines.
						<li>Submit a pull request! Thank you!</li>
					</ol>
					<div>
						The videos will be reshuffled every day, so sometimes your video
						will be at the bottom, sometimes it will be at the top. By
						submitting, <br /> you agree that we can host your video and
						cross-post it (with attribution) to other platforms, like our
						Instagram.
					</div>
				</div>
				<br />
				<br />
				<br />
				<br />
				<hr />

				<div className="actions">
					{!openReport && (
						<a
							onClick={() => setOpenReport(!openReport)}
							onKeyPress={() => setOpenReport(!openReport)}
							role="button"
							tabIndex={0}
							className="report"
						>
							{openReport ? 'Back' : 'Report abuse'}
						</a>
					)}
				</div>
				<div className="report-form">
					{openReport && (
						<ReportForm
							playbackId={playbackId}
							close={() => setOpenReport(false)}
						/>
					)}
				</div>
			</div>
			<style jsx>
				{`
					.actions a:first-child {
						padding-right: 30px;
					}
					.error-message {
						color: #ccc;
					}
					.report-form {
						margin-top: 20px;
					}
					.wrapper {
						display: ${isLoaded ? 'flex' : 'none'};
						flex-direction: column;
						flex-grow: 1;
						align-items: center;
						justify-content: center;
					}
				`}
			</style>
			<style jsx>
				{`
					pre {
						background-color: rgb(0, 0, 0, 0.1);
						padding-left: 10px;
						padding-right: 10px;
					}
					ol li {
						margin-top: 12px;
						margin-bottom: 12px;
						line-height: 1.5;
					}
				`}
			</style>
		</Layout>
	);
};

export default Playback;
