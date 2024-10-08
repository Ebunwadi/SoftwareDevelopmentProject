// code by Albert
import { AddIcon } from "@chakra-ui/icons";
import {
	Button,
	CloseButton,
	Flex,
	FormControl,
	Image,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Text,
	Textarea,
	useColorModeValue,
	useDisclosure,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import usePreviewImg from "../hooks/usePreviewImg";
import { BsFillImageFill } from "react-icons/bs";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import postsAtom from "../atoms/postsAtom";
import { useParams } from "react-router-dom";

const MAX_CHAR = 500;

const CreatePost = () => {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [postText, setPostText] = useState("");
	const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg();
	const imageRef = useRef(null);
	const [remainingChar, setRemainingChar] = useState(MAX_CHAR);
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();
	const [loading, setLoading] = useState(false);
	const [posts, setPosts] = useRecoilState(postsAtom);
	const { username } = useParams();
    // const [aiGeneratedContent, setAiGeneratedContent] = useState('');

	const socialMediaContents = [
		"🌟 Ready to conquer the day? Start with a positive mindset and let nothing stand in your way! 💪✨ Whether you're working on a big project or just tackling your to-do list, remember that consistency is key. Keep pushing, and success will follow. #MotivationMonday #SuccessJourney",
		"Life is too short to wait for the perfect moment. Create your own opportunities and make every day count! 🌱💼 Embrace the challenges, learn from them, and grow stronger. Today is your day to shine—let's make it happen! #Inspiration #DailyGrind",
		"Gratitude turns what we have into enough. 🙏 Take a moment today to appreciate the little things that bring you joy. Whether it's a warm cup of coffee or a good book, these moments matter. Spread positivity and kindness wherever you go. #Gratitude #PositiveVibes",
		"Need a boost of motivation? Remember, every day is a chance to reinvent yourself. 🌟 Keep pushing toward your goals and never stop believing in your potential! 💪 #MotivationMonday #BelieveInYourself",
		"Feeling grateful today for all the small wins! Sometimes it's the little things that make the biggest difference. 🙌 What are you grateful for today? 🌼 #Gratitude #PositiveVibes",
		"Start your day with a smile and positive thoughts! 😊 The energy you put out into the world will come back to you. Let's spread kindness and happiness today! 🌈 #GoodVibesOnly #Happiness"
	
	];
	
	const getRandomContent = () => {
		const randomIndex = Math.floor(Math.random() * socialMediaContents.length);
		return socialMediaContents[randomIndex];
	};

    const handleGenerateContent = () => {
        const generatedContent = getRandomContent();
        setPostText(generatedContent);
		// setAiGeneratedContent(generatedContent)
    };
	const handleTextChange = (e) => {
		const inputText = e.target.value;

		if (inputText.length > MAX_CHAR) {
			const truncatedText = inputText.slice(0, MAX_CHAR);
			setPostText(truncatedText);
			setRemainingChar(0);
		} else {
			setPostText(inputText);
			setRemainingChar(MAX_CHAR - inputText.length);
		}
	};

	const handleCreatePost = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/posts/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ postedBy: user._id, text: postText, img: imgUrl }),
			});

			const data = await res.json();			
			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}
			showToast("Success", "Post created successfully", "success");
			if (username === user.username) {
				setPosts([data, ...posts]);
			}
			onClose();
			setPostText("");
			setImgUrl("");
		} catch (error) {
			showToast("Error", error, "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Button
				position={"fixed"}
				bottom={10}
				right={5}
				bg={useColorModeValue("gray.300", "gray.dark")}
				onClick={onOpen}
				size={{ base: "sm", sm: "md" }}
			>
				<AddIcon />
			</Button>

			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay />

				<ModalContent>
					<ModalHeader>Create Post</ModalHeader>
					<ModalCloseButton />
					<ModalBody pb={6}>
						<FormControl>
							<Textarea
								placeholder='Post content goes here..'
								onChange={handleTextChange}
								value={postText}
							/>
							<Text fontSize='xs' fontWeight='bold' textAlign={"right"} m={"1"} color={"gray.800"}>
								{remainingChar}/{MAX_CHAR}
							</Text>

							<Input type='file' hidden ref={imageRef} onChange={handleImageChange} />

							<BsFillImageFill
								style={{ marginLeft: "5px", cursor: "pointer" }}
								size={16}
								onClick={() => imageRef.current.click()}
							/>
						</FormControl>

						{imgUrl && (
							<Flex mt={5} w={"full"} position={"relative"}>
								<Image src={imgUrl} alt='Selected img' />
								<CloseButton
									onClick={() => {
										setImgUrl("");
									}}
									bg={"gray.800"}
									position={"absolute"}
									top={2}
									right={2}
								/>
							</Flex>
						)}
					</ModalBody>

					<ModalFooter>
						<Button colorScheme='blue' mr={3} onClick={handleCreatePost} isLoading={loading}>
							Post
						</Button>
						<button onClick={handleGenerateContent}>Generate AI Content</button>
            {/* <textarea value={text} onChange={(e) => setPostText(e.target.value)} /> */}
            {/* {aiGeneratedContent && <p>AI Generated Content: {aiGeneratedContent}</p>} */}
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
};

export default CreatePost;
