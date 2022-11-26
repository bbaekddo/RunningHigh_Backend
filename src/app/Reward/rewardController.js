const rewardService = require('./rewardService');
const rewardProvider = require('./rewardProvider');
const baseResponse = require('../../../config/baseResponseStatus');
const {response, errResponse} = require('../../../config/response');

// 한글, 영어, 숫제 제외한 특수문자를 찾는 정규표현식
const specialCharacter = /[^\w\sㄱ-힣]|[\_]/g;

// 경도, 위도 검사
const coordinateCheck = /^\d+\.\d+$/;

/** 리워드 매인 API
 * [GET] /rewards/users
 */
exports.getRewardInfo = async function (req, res) {
    const userId = req.verifiedToken.id;
    
    try {
        const getRewardInfoResult = await rewardProvider.retrieveRewardMain(userId);
    
        return res.send(getRewardInfoResult);
    } catch {
        return res.send(errResponse(baseResponse.DB_ERROR));
    }
};

/** 운동 선택 API
 * [GET] /app/rewards/running/exercise
 * query : type
 */
exports.checkUserExerciseGroup = async function (req, res) {
    const userId = req.verifiedToken.id;
    const {type} = req.query;
    
    // 운동 종류 유효성 검사
    if (type !== 'P' && type !== 'G') {
        return res.send(errResponse(baseResponse.RUNNING_CHOOSE_EXERCISE_TYPE_WRONG));
    }
    
    const getUserExerciseGroupResult = await rewardProvider.retrieveUserExerciseGroup(userId, type);
    
    return res.send(getUserExerciseGroupResult);
};

/** 운동 시작 API
 * [POST] /app/rewards/running/start
 * body : longitude, latitude
 */
exports.postUserRunning = async function (req, res) {
    const {provider, email} = req.verifiedToken;
    const {longitude, latitude} = req.body;
    
    // 경도와 위도 정보가 없을 경우
    if (longitude === undefined || latitude === undefined) {
        return res.send(errResponse(baseResponse.RUNNING_START_LOCATION_EMPTY));
    }
    
    // 경도와 위도가 소수점이 아닐 경우
    if (!coordinateCheck.test(longitude) || !coordinateCheck.test(latitude)) {
        return res.send(errResponse(baseResponse.RUNNING_START_LOCATION_TYPE_WRONG));
    }
    
    const postUserRunningResponse = await rewardService.startUserRunning(provider, email, longitude, latitude);
    
    return res.send(postUserRunningResponse);
};

/** 운동 진행 API
 * [POST] /app/rewards/running/check
 * query : isRestart
 * body : longitude, latitude
 */
exports.postUserRunningCheck = async function (req, res) {
    const {provider, email} = req.verifiedToken;
    const isRestart = req.query.isRestart;
    const {longitude, latitude} = req.body;
    
    // 운동 재시작 여부 타입 확인
    if (isRestart !== true && isRestart !== false) {
        return res.send(errResponse(baseResponse.RUNNING_CHECK_RESTART_TYPE_WRONG));
    }
    
    // 경도와 위도 정보가 없을 경우
    if (longitude === undefined || latitude === undefined) {
        return res.send(errResponse(baseResponse.RUNNING_CHECK_LOCATION_EMPTY));
    }
    
    // 경도와 위도가 소수점이 아닐 경우
    if (!coordinateCheck.test(longitude) || !coordinateCheck.test(latitude)) {
        return res.send(errResponse(baseResponse.RUNNING_CHECK_LOCATION_TYPE_WRONG));
    }
    
    // 일시정지 후 재시작인 경우
    if (isRestart) {
        const postUserRunningRestartResponse = await rewardService.restartUserRunning(provider, email, longitude, latitude);
    
        return res.send(postUserRunningRestartResponse);
    } else {
        const postUserRunningCheckResponse = await rewardService.checkUserRunning(provider, email, longitude, latitude);
    
        return res.send(postUserRunningCheckResponse);
    }
};

/** 운동 일시정지 API
 * [POST] /app/rewards/running/stop
 * body : longitude, latitude
 */
exports.postUserRunningStop = async function (req, res) {
    const {provider, email} = req.verifiedToken;
    const {longitude, latitude} = req.body;
    
    // 경도와 위도 정보가 없을 경우
    if (longitude === undefined || latitude === undefined) {
        return res.send(errResponse(baseResponse.RUNNING_STOP_LOCATION_EMPTY));
    }
    
    // 경도와 위도가 소수점이 아닐 경우
    if (!coordinateCheck.test(longitude) || !coordinateCheck.test(latitude)) {
        return res.send(errResponse(baseResponse.RUNNING_STOP_LOCATION_TYPE_WRONG));
    }
    
    // 현재 위치까지 운동 기록 저장
    const postUserRunningStopResponse = await rewardService.pauseUserRunning(provider, email, longitude, latitude);
    
    return res.send(postUserRunningStopResponse);
};

/** 운동 종료 API
 * [POST] /app/rewards/running/end
 * query : forceEnd
 * body : longitude, latitude
 */
exports.postUserRunningEnd = async function (req, res) {
    const {provider, email} = req.verifiedToken;
    const forceEnd = req.query.forceEnd;
    const {longitude, latitude} = req.body;
    
    // 강제 종료 여부 확인
    if (forceEnd !== true && forceEnd !== false) {
        return res.send(errResponse(baseResponse.RUNNING_END_FORCE_END_WRONG));
    }
    
    // 경도와 위도 정보가 없을 경우
    if (longitude === undefined || latitude === undefined) {
        return res.send(errResponse(baseResponse.RUNNING_END_LOCATION_EMPTY));
    }
    
    // 경도와 위도가 소수점이 아닐 경우
    if (!coordinateCheck.test(longitude) || !coordinateCheck.test(latitude)) {
        return res.send(errResponse(baseResponse.RUNNING_END_LOCATION_TYPE_WRONG));
    }
    
    // 운동 기록 저장 후 종료
    const postUserRunningEndResponse = await rewardService.endUserRunning(provider, email, forceEnd, longitude, latitude);
    
    return res.send(postUserRunningEndResponse);
};

/** 운동 사진 인증 API
 * [POST] /app/rewards/running/imageProof
 * body : exercise_id, image
 */
exports.postRunningImage = async function (req, res) {
    const {provider, email} = req.verifiedToken;
    let {exercise_id} = req.body
    exercise_id = Number(exercise_id);
    
    // 운동 사진 불러오기
    const imageLink = req.file.location;
    if (imageLink === undefined || imageLink === null || imageLink === '') {
        return res.send(errResponse(baseResponse.RUNNING_PROOF_IMAGE_EMPTY));
    }
    
    // 운동 ID 유효성 검사
    if (exercise_id === undefined || exercise_id === null || exercise_id === '') {
        return res.send(errResponse(baseResponse.RUNNING_PROOF_EXERCISE_ID_EMPTY));
    }
    
    // 운동 기록에 사진 저장
    const postRunningImageResponse = await rewardService.createRunningImage(provider, email, exercise_id, imageLink);
    
    return res.send(postRunningImageResponse);
};




/** 챌린지 확인 API
 * [GET] /app/rewards/challenge
 * body :
 */
exports.getChallenge = async function (req, res) {
    const {provider, email} = req.verifiedToken;
    
    const getchallengeResult = await rewardProvider.retrieveChallenge();
    
    if (getchallengeResult === 'NoChallenges') {
        return res.send(errResponse(baseResponse.CHALLENGE_NOT_FOUND));
    }
    
    return res.send(response(baseResponse.SUCCESS, getchallengeResult));
};

/** 챌린지 등록 API
 * [POST] /app/rewards/challenge
 * body : title, content, condition, end_date
 */
exports.postChallenge = async function (req, res) {
    const { title, content, condition, end_date } = req.body;
    
    const postChallengeResult = await rewardService.createChallenge(title, content, condition, end_date)
    
    return res.send(postChallengeResult);
};